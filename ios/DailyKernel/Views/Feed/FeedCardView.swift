import SwiftUI
import SafariServices

struct FeedCardView: View {
    let item: FeedItem
    @State private var showWebView = false

    private var categoryColors: (Color, Color) {
        CategoryColors.forCategory(item.categoryName)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Top row: category + source badge
            HStack {
                CategoryBadge(name: item.categoryName)
                Spacer()
                sourceBadge
            }

            // Title
            Text(item.title)
                .font(.headline)
                .foregroundStyle(.primary)
                .lineLimit(3)

            // Summary
            Text(item.summary)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .lineSpacing(3)
                .lineLimit(6)

            // Bottom row: source link + timestamp
            HStack {
                if let sourceName = item.sourceName {
                    if let sourceUrl = item.sourceUrl, let url = URL(string: sourceUrl) {
                        Button {
                            showWebView = true
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: "safari")
                                    .font(.caption2)
                                Text(sourceName)
                                    .font(.caption)
                                    .lineLimit(1)
                            }
                            .foregroundStyle(Color.appPrimaryLight)
                        }
                        .accessibilityLabel("Open \(sourceName) in browser")
                        .sheet(isPresented: $showWebView) {
                            SafariWebView(url: url)
                        }
                    } else {
                        HStack(spacing: 4) {
                            Image(systemName: "link")
                                .font(.caption2)
                            Text(sourceName)
                                .font(.caption)
                                .lineLimit(1)
                        }
                        .foregroundStyle(.tertiary)
                    }
                }

                Spacer()

                Text(item.timestamp.relativeDate())
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(16)
        .background(
            ZStack {
                categoryColors.0.opacity(0.06)
                Rectangle().fill(.ultraThinMaterial)
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(Color.glassBorder, lineWidth: 0.5)
        )
        .shadow(color: .black.opacity(0.12), radius: 6, y: 3)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(item.categoryName): \(item.title)")
    }

    @ViewBuilder
    private var sourceBadge: some View {
        let text: String = {
            switch item.source {
            case "both": return "Liked & Saved"
            case "liked": return "Liked"
            case "saved": return "Saved"
            default: return item.source.capitalized
            }
        }()

        let color: Color = {
            switch item.source {
            case "both": return .purple
            case "liked": return .green
            case "saved": return .blue
            default: return .gray
            }
        }()

        Text(text)
            .font(.caption2.weight(.medium))
            .foregroundStyle(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.12))
            .background(.ultraThinMaterial)
            .clipShape(Capsule())
    }
}

// MARK: - Safari Web View

struct SafariWebView: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> SFSafariViewController {
        let config = SFSafariViewController.Configuration()
        config.entersReaderIfAvailable = false
        let vc = SFSafariViewController(url: url, configuration: config)
        vc.preferredControlTintColor = UIColor(Color.appPrimary)
        return vc
    }

    func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {}
}
