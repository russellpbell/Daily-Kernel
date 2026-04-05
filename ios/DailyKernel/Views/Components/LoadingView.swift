import SwiftUI

struct LoadingView: View {
    var message: String? = nil

    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .controlSize(.large)
                .tint(Color.appPrimaryLight)

            if let message = message {
                Text(message)
                    .font(.subheadline)
                    .foregroundStyle(.gray)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
