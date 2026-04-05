import SwiftUI

struct BriefingCardView: View {
    let card: Card
    var isSaved: Bool = false
    var onSaveToggle: (() -> Void)?

    private var categoryColors: (Color, Color) {
        CategoryColors.forCategory(card.categoryName)
    }

    var body: some View {
        ZStack(alignment: .topLeading) {
            // Background gradient
            RoundedRectangle(cornerRadius: 20)
                .fill(
                    LinearGradient(
                        colors: [
                            categoryColors.0.opacity(0.3),
                            categoryColors.1.opacity(0.15),
                            Color.appSurface
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(categoryColors.0.opacity(0.3), lineWidth: 1)
                )

            VStack(alignment: .leading, spacing: 12) {
                // Top row: category badge + save button
                HStack {
                    CategoryBadge(name: card.categoryName)

                    if card.isReview == true {
                        Text("Review")
                            .font(.caption2.bold())
                            .foregroundStyle(.orange)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.orange.opacity(0.2))
                            .cornerRadius(8)
                    }

                    Spacer()

                    Button {
                        onSaveToggle?()
                    } label: {
                        Image(systemName: isSaved ? "bookmark.fill" : "bookmark")
                            .font(.title3)
                            .foregroundStyle(isSaved ? Color.appSecondary : .white.opacity(0.6))
                    }
                    .frame(width: 44, height: 44)
                }

                // Title
                Text(card.title)
                    .font(.title3.bold())
                    .foregroundStyle(.white)
                    .lineLimit(3)
                    .fixedSize(horizontal: false, vertical: true)

                // Summary (scrollable)
                ScrollView(.vertical, showsIndicators: false) {
                    Text(card.summary)
                        .font(.body)
                        .foregroundStyle(.white.opacity(0.85))
                        .lineSpacing(4)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxHeight: .infinity)

                // Source
                if let sourceName = card.sourceName {
                    HStack(spacing: 6) {
                        Image(systemName: "link")
                            .font(.caption2)
                            .foregroundStyle(.gray)

                        if let sourceUrl = card.sourceUrl, let url = URL(string: sourceUrl) {
                            Link(sourceName, destination: url)
                                .font(.caption)
                                .foregroundStyle(Color.appPrimaryLight)
                                .lineLimit(1)
                        } else {
                            Text(sourceName)
                                .font(.caption)
                                .foregroundStyle(.gray)
                                .lineLimit(1)
                        }
                    }
                    .padding(.top, 4)
                }
            }
            .padding(20)
        }
        .frame(height: 400)
        .shadow(color: .black.opacity(0.3), radius: 10, x: 0, y: 5)
    }
}
