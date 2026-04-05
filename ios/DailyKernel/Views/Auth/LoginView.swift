import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authService: AuthService
    @State private var email = ""
    @State private var code = ""
    @State private var codeSent = false
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var successMessage: String?

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 32) {
                    Spacer().frame(height: 60)

                    // Branding
                    VStack(spacing: 12) {
                        Text("\u{1F331}")
                            .font(.system(size: 64))

                        Text("Daily Kernel")
                            .font(.system(size: 34, weight: .bold))
                            .foregroundStyle(.white)

                        Text("Your daily knowledge briefing")
                            .font(.subheadline)
                            .foregroundStyle(.gray)
                    }

                    Spacer().frame(height: 20)

                    // Form
                    VStack(spacing: 20) {
                        // Email field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Email")
                                .font(.caption)
                                .foregroundStyle(.gray)

                            TextField("you@example.com", text: $email)
                                .textFieldStyle(.plain)
                                .keyboardType(.emailAddress)
                                .textContentType(.emailAddress)
                                .autocapitalization(.none)
                                .disableAutocorrection(true)
                                .padding()
                                .background(Color.appSurface)
                                .cornerRadius(12)
                                .foregroundStyle(.white)
                                .disabled(codeSent)
                                .opacity(codeSent ? 0.6 : 1)
                        }

                        if codeSent {
                            // Code input
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Verification Code")
                                    .font(.caption)
                                    .foregroundStyle(.gray)

                                TextField("000000", text: $code)
                                    .textFieldStyle(.plain)
                                    .keyboardType(.numberPad)
                                    .textContentType(.oneTimeCode)
                                    .multilineTextAlignment(.center)
                                    .font(.system(size: 24, weight: .semibold, design: .monospaced))
                                    .padding()
                                    .background(Color.appSurface)
                                    .cornerRadius(12)
                                    .foregroundStyle(.white)
                                    .onChange(of: code) { _, newValue in
                                        code = String(newValue.prefix(6)).filter { $0.isNumber }
                                    }
                            }
                            .transition(.move(edge: .bottom).combined(with: .opacity))

                            // Verify button
                            Button(action: verifyCode) {
                                HStack {
                                    if isLoading {
                                        ProgressView()
                                            .tint(.white)
                                    }
                                    Text("Verify")
                                        .fontWeight(.semibold)
                                }
                                .frame(maxWidth: .infinity)
                                .frame(height: 50)
                                .background(code.count == 6 ? Color.appPrimary : Color.appSurfaceLight)
                                .foregroundStyle(.white)
                                .cornerRadius(12)
                            }
                            .disabled(code.count != 6 || isLoading)

                            // Back button
                            Button {
                                withAnimation(.spring(response: 0.3)) {
                                    codeSent = false
                                    code = ""
                                    errorMessage = nil
                                    successMessage = nil
                                }
                            } label: {
                                Text("Use a different email")
                                    .font(.subheadline)
                                    .foregroundStyle(Color.appPrimaryLight)
                            }
                            .frame(height: 44)
                        } else {
                            // Send buttons
                            VStack(spacing: 12) {
                                Button(action: sendCode) {
                                    HStack {
                                        if isLoading {
                                            ProgressView()
                                                .tint(.white)
                                        }
                                        Text("Send Code")
                                            .fontWeight(.semibold)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 50)
                                    .background(isValidEmail ? Color.appPrimary : Color.appSurfaceLight)
                                    .foregroundStyle(.white)
                                    .cornerRadius(12)
                                }
                                .disabled(!isValidEmail || isLoading)

                                Button(action: sendMagicLink) {
                                    HStack {
                                        if isLoading {
                                            ProgressView()
                                                .tint(Color.appPrimaryLight)
                                        }
                                        Text("Send Magic Link")
                                            .fontWeight(.medium)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 50)
                                    .background(Color.appSurface)
                                    .foregroundStyle(Color.appPrimaryLight)
                                    .cornerRadius(12)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12)
                                            .stroke(Color.appSurfaceLight, lineWidth: 1)
                                    )
                                }
                                .disabled(!isValidEmail || isLoading)
                            }
                        }

                        // Messages
                        if let error = errorMessage {
                            Text(error)
                                .font(.subheadline)
                                .foregroundStyle(.red)
                                .multilineTextAlignment(.center)
                                .transition(.opacity)
                        }

                        if let success = successMessage {
                            Text(success)
                                .font(.subheadline)
                                .foregroundStyle(.green)
                                .multilineTextAlignment(.center)
                                .transition(.opacity)
                        }
                    }
                    .padding(.horizontal, 32)

                    Spacer()
                }
            }
        }
    }

    private var isValidEmail: Bool {
        let pattern = #"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"#
        return email.range(of: pattern, options: .regularExpression) != nil
    }

    private func sendCode() {
        Task {
            isLoading = true
            errorMessage = nil
            successMessage = nil
            do {
                try await authService.signInWithOTP(email: email)
                withAnimation(.spring(response: 0.3)) {
                    codeSent = true
                    successMessage = "Code sent to \(email)"
                }
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }

    private func sendMagicLink() {
        Task {
            isLoading = true
            errorMessage = nil
            successMessage = nil
            do {
                try await authService.signInWithOTP(email: email)
                successMessage = "Magic link sent to \(email). Check your inbox."
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }

    private func verifyCode() {
        Task {
            isLoading = true
            errorMessage = nil
            do {
                try await authService.verifyOTP(email: email, code: code)
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}
