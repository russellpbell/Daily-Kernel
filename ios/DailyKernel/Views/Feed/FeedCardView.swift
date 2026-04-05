import SwiftUI

struct FeedCardView: View {
    let item: FeedItem
    @State private var showWebView = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Top row: category + badges
            HStack {
                CategoryBadge(name: item.categoryName)

                Spacer()

                sourceBadge
            }

            // Title
            Text(item.title)
                .font(.headline)
                .foregroundStyle(.white)
                .lineLimit(3)

            // Summary
            Text(item.summary)
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.75))
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
                        .foregroundStyle(.gray)
                    }
                }

                Spacer()

                Text(item.timestamp.relativeDate())
                    .font(.caption2)
                    .foregroundStyle(.gray)
            }
        }
        .padding(16)
        .background(Color.appSurface)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.appSurfaceLight.opacity(0.5), lineWidth: 1)
        )
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
            .background(color.opacity(0.15))
            .cornerRadius(8)
    }
}

// MARK: - Safari Web View

import SafariServices

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
