import SwiftUI

struct BriefingCardView: View {
    let card: Card
    var isSaved: Bool = false
    var onSaveToggle: (() -> Void)?

    private var categoryColors: (Color, Color) {
        CategoryColors.forCategory(card.categoryName)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header: category badge + review tag + save button
            HStack {
                CategoryBadge(name: card.categoryName)

                if card.isReview == true {
                    Text("Review")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(Color.appSecondary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Color.appSecondary.opacity(0.15))
                        .background(.ultraThinMaterial)
                        .clipShape(Capsule())
                }

                Spacer()

                if let onSaveToggle {
                    Button(action: onSaveToggle) {
                        Image(systemName: isSaved ? "bookmark.fill" : "bookmark")
                            .font(.system(size: 18))
                            .symbolRenderingMode(.hierarchical)
                            .foregroundStyle(isSaved ? Color.appPrimary : .secondary)
                            .contentTransition(.symbolEffect(.replace))
                    }
                    .frame(minWidth: 44, minHeight: 44)
                    .accessibilityLabel(isSaved ? "Remove from reading list" : "Save to reading list")
                    .accessibilityAddTraits(.isButton)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)

            // Title
            Text(card.title)
                .font(.title3.bold())
                .foregroundStyle(.primary)
                .lineLimit(3)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, 20)
                .padding(.top, 12)

            // Summary (scrollable)
            ScrollView(.vertical, showsIndicators: false) {
                Text(card.summary)
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .lineSpacing(4)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, 20)
                    .padding(.top, 8)
                    .padding(.bottom, 16)
            }
            .frame(maxHeight: .infinity)

            // Footer: source
            if let sourceName = card.sourceName, !sourceName.isEmpty {
                HStack(spacing: 6) {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [categoryColors.0, categoryColors.1],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 6, height: 6)

                    if let sourceUrl = card.sourceUrl, let url = URL(string: sourceUrl) {
                        Link(sourceName, destination: url)
                            .font(.caption)
                            .foregroundStyle(Color.appPrimaryLight)
                            .lineLimit(1)
                    } else {
                        Text(sourceName)
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                            .lineLimit(1)
                    }

                    Spacer()
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
                .padding(.top, 8)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(
            ZStack {
                // Category-tinted gradient base
                LinearGradient(
                    colors: [categoryColors.0.opacity(0.15), categoryColors.1.opacity(0.08)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                // Glass material overlay
                Rectangle().fill(.ultraThinMaterial)
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .strokeBorder(
                    LinearGradient(
                        colors: [Color.glassHighlight, Color.glassBorder],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 0.5
                )
        )
        .shadow(color: .black.opacity(0.3), radius: 20, y: 10)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(card.categoryName): \(card.title)")
        .accessibilityHint(card.summary)
    }
}
