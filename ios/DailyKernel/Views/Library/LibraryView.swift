import SwiftUI

struct LibraryView: View {
    @State private var selectedTab: LibraryTab = .readingList
    @State private var readingListItems: [ReadingListItem] = []
    @State private var expertise: [UserExpertise] = []
    @State private var recentTopics: [RecentTopic] = []
    @State private var readFilter: ReadFilter = .all
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var showError = false

    private let api = APIClient.shared

    enum LibraryTab: String, CaseIterable {
        case readingList = "Reading List"
        case knowledge = "Knowledge"
    }

    enum ReadFilter: String, CaseIterable {
        case all = "All"
        case unread = "Unread"
        case read = "Read"
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBackground.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Tab picker
                    Picker("Section", selection: $selectedTab) {
                        ForEach(LibraryTab.allCases, id: \.self) { tab in
                            Text(tab.rawValue).tag(tab)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal)
                    .padding(.top, 8)
                    .onChange(of: selectedTab) { _, newValue in
                        Task {
                            if newValue == .readingList {
                                await loadReadingList()
                            } else {
                                await loadKnowledge()
                            }
                        }
                    }

                    if isLoading {
                        Spacer()
                        LoadingView(message: "Loading...")
                        Spacer()
                    } else {
                        switch selectedTab {
                        case .readingList:
                            readingListSection
                        case .knowledge:
                            knowledgeSection
                        }
                    }
                }
            }
            .navigationTitle("Library")
            .navigationBarTitleDisplayMode(.inline)
            .alert("Error", isPresented: $showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "Something went wrong")
            }
            .task {
                await loadReadingList()
            }
        }
    }

    // MARK: - Reading List

    private var readingListSection: some View {
        VStack(spacing: 0) {
            // Filter pills
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(ReadFilter.allCases, id: \.self) { filter in
                        Button {
                            if readFilter != filter {
                                readFilter = filter
                                Task { await loadReadingList() }
                            }
                        } label: {
                            Text(filter.rawValue)
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(readFilter == filter ? .white : .gray)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(readFilter == filter ? Color.appPrimary : Color.appSurface)
                                .cornerRadius(20)
                        }
                    }
                }
                .padding(.horizontal)
                .padding(.vertical, 12)
            }

            if readingListItems.isEmpty {
                Spacer()
                EmptyStateView(
                    icon: "bookmark",
                    message: "No saved items",
                    detail: "Swipe up on briefing cards to save them for later"
                )
                Spacer()
            } else {
                List {
                    ForEach(readingListItems) { item in
                        ReadingListItemView(
                            item: item,
                            onMarkRead: { markAsRead(item) },
                            onDelete: { deleteItem(item) },
                            onUpdateNotes: { notes in updateNotes(item, notes: notes) }
                        )
                        .listRowBackground(Color.appBackground)
                        .listRowSeparatorTint(Color.appSurfaceLight.opacity(0.5))
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
            }
        }
    }

    // MARK: - Knowledge

    private var knowledgeSection: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                if expertise.isEmpty {
                    EmptyStateView(
                        icon: "brain",
                        message: "No expertise yet",
                        detail: "Review briefing cards to build your knowledge profile"
                    )
                    .frame(maxWidth: .infinity)
                    .padding(.top, 60)
                } else {
                    // Expertise cards
                    Text("Your Expertise")
                        .font(.headline)
                        .foregroundStyle(.white)
                        .padding(.horizontal)

                    LazyVStack(spacing: 12) {
                        ForEach(expertise) { exp in
                            ExpertiseCardView(expertise: exp)
                        }
                    }
                    .padding(.horizontal)

                    // Recent topics
                    if !recentTopics.isEmpty {
                        Text("Recent Topics")
                            .font(.headline)
                            .foregroundStyle(.white)
                            .padding(.horizontal)
                            .padding(.top, 8)

                        LazyVStack(spacing: 8) {
                            ForEach(recentTopics) { topic in
                                HStack {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(topic.topic)
                                            .font(.subheadline)
                                            .foregroundStyle(.white)

                                        HStack(spacing: 8) {
                                            CategoryBadge(name: topic.categoryName)
                                            Text("Seen \(topic.timesSeen)x")
                                                .font(.caption2)
                                                .foregroundStyle(.gray)
                                        }
                                    }

                                    Spacer()

                                    Text(topic.lastSeenAt.relativeDate())
                                        .font(.caption2)
                                        .foregroundStyle(.gray)
                                }
                                .padding(12)
                                .background(Color.appSurface)
                                .cornerRadius(12)
                            }
                        }
                        .padding(.horizontal)
                    }
                }
            }
            .padding(.vertical, 16)
        }
    }

    // MARK: - Data Loading

    private func loadReadingList() async {
        isLoading = true
        do {
            let filterParam: Bool? = {
                switch readFilter {
                case .all: return nil
                case .unread: return false
                case .read: return true
                }
            }()
            let response = try await api.getReadingList(readFilter: filterParam)
            readingListItems = response.items
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        isLoading = false
    }

    private func loadKnowledge() async {
        isLoading = true
        do {
            let response = try await api.getKnowledge()
            expertise = response.expertise
            recentTopics = response.recentTopics
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        isLoading = false
    }

    private func markAsRead(_ item: ReadingListItem) {
        Task {
            do {
                try await api.updateReadingListItem(id: item.id, updates: ["is_read": true])
                if let index = readingListItems.firstIndex(where: { $0.id == item.id }) {
                    readingListItems[index] = ReadingListItem(
                        id: item.id, cardId: item.cardId, title: item.title,
                        summary: item.summary, sourceUrl: item.sourceUrl,
                        sourceName: item.sourceName, categoryName: item.categoryName,
                        notes: item.notes, isRead: true, savedAt: item.savedAt
                    )
                }
            } catch {
                errorMessage = error.localizedDescription
                showError = true
            }
        }
    }

    private func deleteItem(_ item: ReadingListItem) {
        Task {
            do {
                try await api.removeFromReadingList(id: item.id)
                readingListItems.removeAll { $0.id == item.id }
            } catch {
                errorMessage = error.localizedDescription
                showError = true
            }
        }
    }

    private func updateNotes(_ item: ReadingListItem, notes: String) {
        Task {
            try? await api.updateReadingListItem(id: item.id, updates: ["notes": notes])
        }
    }
}
