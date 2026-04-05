import SwiftUI

struct GlassCard: ViewModifier {
    var cornerRadius: CGFloat = 16
    var padding: CGFloat = 16
    var tintColor: Color? = nil

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(
                ZStack {
                    if let tint = tintColor {
                        tint.opacity(0.08)
                    }
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .fill(.ultraThinMaterial)
                }
            )
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .strokeBorder(
                        LinearGradient(
                            colors: [Color.glassHighlight, Color.glassBorder],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 0.5
                    )
            )
            .shadow(color: .black.opacity(0.15), radius: 8, y: 4)
    }
}

extension View {
    func glassCard(cornerRadius: CGFloat = 16, padding: CGFloat = 16, tint: Color? = nil) -> some View {
        modifier(GlassCard(cornerRadius: cornerRadius, padding: padding, tintColor: tint))
    }
}
