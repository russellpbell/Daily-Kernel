import SwiftUI

struct EmptyStateView: View {
    let icon: String
    let message: String
    var detail: String? = nil
    var actionLabel: String? = nil
    var action: (() -> Void)? = nil

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 48))
                .foregroundStyle(Color.appPrimary.opacity(0.6))

            Text(message)
                .font(.headline)
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)

            if let detail = detail {
                Text(detail)
                    .font(.subheadline)
                    .foregroundStyle(.gray)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            if let actionLabel = actionLabel, let action = action {
                Button(action: action) {
                    Text(actionLabel)
                        .fontWeight(.semibold)
                        .foregroundStyle(.white)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 12)
                        .background(Color.appPrimary)
                        .cornerRadius(12)
                }
                .frame(height: 44)
                .padding(.top, 8)
            }
        }
        .padding(20)
    }
}
