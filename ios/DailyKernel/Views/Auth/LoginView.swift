import SwiftUI
import AuthenticationServices

struct LoginView: View {
    @EnvironmentObject var authService: AuthService
    @State private var showEmailFallback = false
    @State private var email = ""
    @State private var code = ""
    @State private var codeSent = false
    @State private var isLoading = false
    @State private var error: String?
    @FocusState private var focusedField: LoginField?

    private enum LoginField {
        case email, code
    }

    var body: some View {
        VStack(spacing: 0) {
            Spacer()

            // Branding
            Text("\u{1F331}")
                .font(.system(size: 64))
                .padding(.bottom, 12)

            Text("Daily Kernel")
                .font(.system(size: 34, weight: .bold))
                .foregroundColor(.white)

            Text("Keep up with your field.")
                .font(.system(size: 17))
                .foregroundColor(.secondary)
                .padding(.top, 4)

            Spacer()

            // Sign in with Apple (primary)
            SignInWithAppleButton(.signIn) { request in
                request.requestedScopes = [.fullName, .email]
            } onCompletion: { result in
                handleAppleResult(result)
            }
            .signInWithAppleButtonStyle(.white)
            .frame(height: 50)
            .cornerRadius(25)
            .padding(.horizontal, 40)

            // Email fallback
            if !showEmailFallback {
                Button("Sign in with email instead") {
                    withAnimation { showEmailFallback = true }
                }
                .font(.system(size: 14))
                .foregroundColor(Color.appPrimaryLight)
                .padding(.top, 16)
                .frame(minHeight: 44)
            } else {
                emailSection
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
            }

            // Error
            if let error {
                Text(error)
                    .font(.system(size: 13))
                    .foregroundColor(.red.opacity(0.8))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                    .padding(.top, 12)
            }

            Spacer()
                .frame(height: 60)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.appBackground)
    }

    @ViewBuilder
    private var emailSection: some View {
        VStack(spacing: 12) {
            if !codeSent {
                TextField("Email", text: $email)
                    .textFieldStyle(.plain)
                    .focused($focusedField, equals: .email)
                    .keyboardType(.emailAddress)
                    .textContentType(.emailAddress)
                    .autocapitalization(.none)
                    .submitLabel(.done)
                    .onSubmit {
                        if !email.isEmpty {
                            Task { await sendCode() }
                        }
                    }
                    .padding()
                    .frame(height: 50)
                    .background(Color.appSurface)
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.1)))
                    .padding(.horizontal, 40)

                Button {
                    Task { await sendCode() }
                } label: {
                    if isLoading {
                        ProgressView().tint(.white)
                    } else {
                        Text("Send Code")
                    }
                }
                .frame(maxWidth: .infinity, minHeight: 50)
                .background(Color.appPrimary)
                .foregroundColor(.white)
                .fontWeight(.semibold)
                .cornerRadius(12)
                .padding(.horizontal, 40)
                .disabled(email.isEmpty || isLoading)
                .opacity(email.isEmpty ? 0.5 : 1)
            } else {
                Text("Enter the code sent to \(email)")
                    .font(.system(size: 14))
                    .foregroundColor(.secondary)

                TextField("Verification code", text: $code)
                    .textFieldStyle(.plain)
                    .focused($focusedField, equals: .code)
                    .keyboardType(.numberPad)
                    .textContentType(.oneTimeCode)
                    .multilineTextAlignment(.center)
                    .font(.system(size: 24, weight: .semibold, design: .monospaced))
                    .submitLabel(.done)
                    .onSubmit {
                        if code.count >= 6 {
                            Task { await verifyCode() }
                        }
                    }
                    .padding()
                    .frame(height: 50)
                    .background(Color.appSurface)
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.1)))
                    .padding(.horizontal, 40)

                Button {
                    Task { await verifyCode() }
                } label: {
                    if isLoading {
                        ProgressView().tint(.white)
                    } else {
                        Text("Verify")
                    }
                }
                .frame(maxWidth: .infinity, minHeight: 50)
                .background(Color.appPrimary)
                .foregroundColor(.white)
                .fontWeight(.semibold)
                .cornerRadius(12)
                .padding(.horizontal, 40)
                .disabled(code.count < 6 || isLoading)
                .opacity(code.count < 6 ? 0.5 : 1)
            }
        }
        .padding(.top, 20)
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Done") { focusedField = nil }
            }
        }
    }

    private func handleAppleResult(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let authorization):
            isLoading = true
            error = nil
            Task {
                do {
                    try await authService.handleAppleSignIn(authorization: authorization)
                } catch {
                    self.error = error.localizedDescription
                }
                isLoading = false
            }
        case .failure(let err):
            if (err as? ASAuthorizationError)?.code != .canceled {
                error = err.localizedDescription
            }
        }
    }

    private func sendCode() async {
        isLoading = true
        error = nil
        do {
            try await authService.signInWithOTP(email: email)
            codeSent = true
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    private func verifyCode() async {
        isLoading = true
        error = nil
        do {
            try await authService.verifyOTP(email: email, code: code)
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}
