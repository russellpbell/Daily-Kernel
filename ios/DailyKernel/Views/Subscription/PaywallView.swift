import SwiftUI
import StoreKit

struct PaywallView: View {
    @EnvironmentObject var storeService: StoreKitService
    @State private var showFreePass = false
    @State private var passCode = ""
    @State private var isRedeeming = false
    @State private var isPurchasing: String?
    @State private var isRestoring = false
    @State private var errorMessage: String?
    @State private var showError = false
    @State private var redeemSuccess = false
    @FocusState private var isPassCodeFocused: Bool

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 32) {
                    Spacer().frame(height: 40)

                    // Branding
                    VStack(spacing: 8) {
                        Text("🌱")
                            .font(.system(size: 48))
                        Text("Daily Kernel")
                            .font(.title.bold())
                            .foregroundStyle(.white)
                        Text("Keep up with your field.")
                            .font(.subheadline)
                            .foregroundStyle(.gray)
                    }

                    // Subscription cards
                    HStack(spacing: 12) {
                        // Monthly
                        subscriptionCard(
                            title: "Monthly",
                            price: monthlyPrice,
                            period: "per month",
                            detail: "Cancel anytime",
                            badge: nil,
                            productID: "com.dailykernel.monthly",
                            highlighted: false
                        )

                        // Annual
                        subscriptionCard(
                            title: "Annual",
                            price: annualPrice,
                            period: "per year",
                            detail: annualMonthlyEquivalent,
                            badge: "Best Value",
                            productID: "com.dailykernel.annual",
                            highlighted: true
                        )
                    }
                    .padding(.horizontal, 20)

                    // Restore purchases
                    Button {
                        Task {
                            isRestoring = true
                            await storeService.restorePurchases()
                            isRestoring = false
                        }
                    } label: {
                        if isRestoring {
                            ProgressView()
                                .tint(.gray)
                        } else {
                            Text("Restore Purchases")
                                .font(.subheadline)
                                .foregroundStyle(.gray)
                        }
                    }

                    // Free pass section
                    VStack(spacing: 12) {
                        if !showFreePass {
                            Button {
                                withAnimation { showFreePass = true }
                            } label: {
                                Text("Have a free pass?")
                                    .font(.subheadline)
                                    .foregroundStyle(.gray.opacity(0.7))
                            }
                        } else {
                            VStack(spacing: 12) {
                                Text("Enter your 8-character pass code")
                                    .font(.caption)
                                    .foregroundStyle(.gray)

                                HStack(spacing: 8) {
                                    TextField("XXXXXXXX", text: $passCode)
                                        .textFieldStyle(.plain)
                                        .focused($isPassCodeFocused)
                                        .font(.body.monospaced())
                                        .multilineTextAlignment(.center)
                                        .textInputAutocapitalization(.characters)
                                        .disableAutocorrection(true)
                                        .submitLabel(.done)
                                        .onSubmit {
                                            if passCode.count == 8 {
                                                Task { await handleRedeem() }
                                            }
                                        }
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 10)
                                        .background(Color.appSurface)
                                        .cornerRadius(10)
                                        .foregroundStyle(.white)
                                        .onChange(of: passCode) { _, newValue in
                                            let filtered = String(newValue.uppercased().filter { $0.isLetter || $0.isNumber }.prefix(8))
                                            if filtered != newValue {
                                                passCode = filtered
                                            }
                                        }

                                    Button {
                                        Task { await handleRedeem() }
                                    } label: {
                                        if isRedeeming {
                                            ProgressView()
                                                .tint(.white)
                                                .frame(width: 70, height: 40)
                                        } else {
                                            Text("Redeem")
                                                .fontWeight(.semibold)
                                                .foregroundStyle(.white)
                                                .frame(width: 70, height: 40)
                                        }
                                    }
                                    .background(Color.appPrimary.opacity(passCode.count == 8 ? 1 : 0.5))
                                    .cornerRadius(10)
                                    .disabled(passCode.count != 8 || isRedeeming)
                                }

                                if redeemSuccess {
                                    Text("Free pass activated!")
                                        .font(.caption)
                                        .foregroundStyle(.green)
                                }
                            }
                            .padding(16)
                            .background(Color.appSurface)
                            .cornerRadius(16)
                            .padding(.horizontal, 20)
                        }
                    }

                    Spacer().frame(height: 40)
                }
            }
        }
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Done") { isPassCodeFocused = false }
            }
        }
        .alert("Error", isPresented: $showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage ?? "Something went wrong")
        }
        .task {
            await storeService.checkFreePassStatus()
        }
    }

    // MARK: - Helpers

    private var monthlyProduct: Product? {
        storeService.products.first { $0.id == "com.dailykernel.monthly" }
    }

    private var annualProduct: Product? {
        storeService.products.first { $0.id == "com.dailykernel.annual" }
    }

    private var monthlyPrice: String {
        monthlyProduct?.displayPrice ?? "$0.99"
    }

    private var annualPrice: String {
        annualProduct?.displayPrice ?? "$9.99"
    }

    private var annualMonthlyEquivalent: String {
        if let product = annualProduct {
            let monthly = product.price / 12
            let formatter = NumberFormatter()
            formatter.numberStyle = .currency
            formatter.locale = product.priceFormatStyle.locale
            return "\(formatter.string(from: monthly as NSDecimalNumber) ?? "$0.83")/mo"
        }
        return "$0.83/mo"
    }

    private func subscriptionCard(
        title: String,
        price: String,
        period: String,
        detail: String,
        badge: String?,
        productID: String,
        highlighted: Bool
    ) -> some View {
        VStack(spacing: 8) {
            if let badge = badge {
                Text(badge)
                    .font(.caption2.bold())
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color.appPrimary)
                    .cornerRadius(8)
            } else {
                Spacer().frame(height: 20)
            }

            Text(title)
                .font(.caption.bold())
                .foregroundStyle(.gray)
                .textCase(.uppercase)

            Text(price)
                .font(.title.bold())
                .foregroundStyle(.white)

            Text(period)
                .font(.caption)
                .foregroundStyle(.gray)

            Text(detail)
                .font(.caption2)
                .foregroundStyle(highlighted ? Color.appPrimaryLight : .gray)

            Spacer().frame(height: 4)

            Button {
                Task { await handlePurchase(productID: productID) }
            } label: {
                if isPurchasing == productID {
                    ProgressView()
                        .tint(.white)
                        .frame(maxWidth: .infinity, minHeight: 36)
                } else {
                    Text("Subscribe")
                        .font(.subheadline.bold())
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity, minHeight: 36)
                }
            }
            .background(Color.appPrimary)
            .cornerRadius(10)
            .disabled(isPurchasing != nil)
        }
        .padding(16)
        .background(Color.appSurface)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(highlighted ? Color.appPrimary.opacity(0.4) : Color.white.opacity(0.05), lineWidth: 1)
        )
        .cornerRadius(16)
    }

    private func handlePurchase(productID: String) async {
        guard let product = storeService.products.first(where: { $0.id == productID }) else {
            errorMessage = "Product not available. Please try again."
            showError = true
            return
        }
        isPurchasing = productID
        do {
            let _ = try await storeService.purchase(product)
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        isPurchasing = nil
    }

    private func handleRedeem() async {
        guard passCode.count == 8 else { return }
        isRedeeming = true
        do {
            try await storeService.redeemFreePass(code: passCode.uppercased())
            redeemSuccess = true
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        isRedeeming = false
    }
}
