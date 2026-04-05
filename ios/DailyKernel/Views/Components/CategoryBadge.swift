import SwiftUI

struct CategoryBadge: View {
    let name: String

    private var colors: (Color, Color) {
        CategoryColors.forCategory(name)
    }

    var body: some View {
        Text(name)
            .font(.caption2.weight(.semibold))
            .foregroundStyle(.white)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(
                LinearGradient(
                    colors: [colors.0, colors.1],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .clipShape(Capsule())
    }
}
