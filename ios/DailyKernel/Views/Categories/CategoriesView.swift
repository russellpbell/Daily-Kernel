import SwiftUI

struct CategoriesView: View {
    @State private var categories: [Category] = []
    @State private var newCategoryName = ""
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var showError = false
    @State private var isAdding = false

    private let api = APIClient.shared

    private let suggestions = [
        "AI", "Climate", "Space", "Health", "Tech", "Finance", "Science", "Politics"
    ]

    private let sourceTypes = ["news", "biomedical", "stem", "academic"]

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBackground.ignoresSafeArea()

                if isLoading {
                    LoadingView(message: "Loading categories...")
                } else {
                    ScrollView {
                        VStack(spacing: 20) {
                            // Add category section
                            addCategorySection

                            // Suggestion chips
                            if !filteredSuggestions.isEmpty {
                                suggestionChips
                            }

                            // Categories list
                            if categories.isEmpty {
                                EmptyStateView(
                                    icon: "square.grid.2x2",
                                    message: "No categories yet",
                                    detail: "Add categories to customize your briefings"
                                )
                                .padding(.top, 40)
                            } else {
                                categoryList
                            }
                        }
                        .padding(.vertical, 16)
                    }
                }
            }
            .navigationTitle("Categories")
            .navigationBarTitleDisplayMode(.inline)
            .alert("Error", isPresented: $showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "Something went wrong")
            }
            .task {
                await loadCategories()
            }
        }
    }

    // MARK: - Add Category

    private var addCategorySection: some View {
        HStack(spacing: 12) {
            TextField("New category name", text: $newCategoryName)
                .textFieldStyle(.plain)
                .padding(12)
                .background(Color.appSurface)
                .cornerRadius(12)
                .foregroundStyle(.white)

            Button {
                addCategory(name: newCategoryName)
            } label: {
                HStack {
                    if isAdding {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Image(systemName: "plus")
                    }
                }
                .frame(width: 44, height: 44)
                .background(
                    newCategoryName.trimmingCharacters(in: .whitespaces).isEmpty
                        ? Color.appSurfaceLight
                        : Color.appPrimary
                )
                .foregroundStyle(.white)
                .cornerRadius(12)
            }
            .disabled(newCategoryName.trimmingCharacters(in: .whitespaces).isEmpty || isAdding)
        }
        .padding(.horizontal)
    }

    // MARK: - Suggestions

    private var filteredSuggestions: [String] {
        let existingNames = Set(categories.map { $0.name.lowercased() })
        return suggestions.filter { !existingNames.contains($0.lowercased()) }
    }

    private var suggestionChips: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Suggestions")
                .font(.caption)
                .foregroundStyle(.gray)
                .padding(.horizontal)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(filteredSuggestions, id: \.self) { suggestion in
                        Button {
                            addCategory(name: suggestion)
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: "plus")
                                    .font(.caption2)
                                Text(suggestion)
                                    .font(.subheadline)
                            }
                            .foregroundStyle(Color.appPrimaryLight)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(Color.appSurface)
                            .cornerRadius(20)
                            .overlay(
                                RoundedRectangle(cornerRadius: 20)
                                    .stroke(Color.appSurfaceLight, lineWidth: 1)
                            )
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
    }

    // MARK: - Category List

    private var categoryList: some View {
        LazyVStack(spacing: 12) {
            ForEach(Array(categories.enumerated()), id: \.element.id) { index, category in
                CategoryRow(
                    category: category,
                    sourceTypes: sourceTypes,
                    onToggle: { isActive in
                        updateCategory(at: index, updates: ["is_active": isActive])
                    },
                    onSourceTypeChange: { sourceType in
                        updateCategory(at: index, updates: ["source_type": sourceType])
                    },
                    onWeightChange: { weight in
                        updateCategory(at: index, updates: ["weight": weight])
                    },
                    onDelete: {
                        deleteCategory(at: index)
                    }
                )
            }
        }
        .padding(.horizontal)
    }

    // MARK: - Actions

    private func loadCategories() async {
        isLoading = true
        do {
            let response = try await api.getCategories()
            categories = response.categories
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        isLoading = false
    }

    private func addCategory(name: String) {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }

        Task {
            isAdding = true
            do {
                let response = try await api.addCategory(name: trimmed)
                categories.append(response.category)
                newCategoryName = ""
            } catch {
                errorMessage = error.localizedDescription
                showError = true
            }
            isAdding = false
        }
    }

    private func updateCategory(at index: Int, updates: [String: Any]) {
        guard index < categories.count else { return }
        let category = categories[index]

        // Optimistic local update
        if let isActive = updates["is_active"] as? Bool {
            categories[index] = Category(
                id: category.id, name: category.name, weight: category.weight,
                isActive: isActive, sourceType: category.sourceType
            )
        }
        if let sourceType = updates["source_type"] as? String {
            categories[index] = Category(
                id: category.id, name: category.name, weight: category.weight,
                isActive: category.isActive, sourceType: sourceType
            )
        }
        if let weight = updates["weight"] as? Double {
            categories[index] = Category(
                id: category.id, name: category.name, weight: weight,
                isActive: category.isActive, sourceType: category.sourceType
            )
        }

        Task {
            do {
                let response = try await api.updateCategory(id: category.id, updates: updates)
                if index < categories.count {
                    categories[index] = response.category
                }
            } catch {
                errorMessage = error.localizedDescription
                showError = true
                // Revert on failure
                if index < categories.count {
                    categories[index] = category
                }
            }
        }
    }

    private func deleteCategory(at index: Int) {
        guard index < categories.count else { return }
        let category = categories[index]
        categories.remove(at: index)

        Task {
            do {
                try await api.deleteCategory(id: category.id)
            } catch {
                errorMessage = error.localizedDescription
                showError = true
                categories.insert(category, at: min(index, categories.count))
            }
        }
    }
}

// MARK: - Category Row

private struct CategoryRow: View {
    let category: Category
    let sourceTypes: [String]
    var onToggle: (Bool) -> Void
    var onSourceTypeChange: (String) -> Void
    var onWeightChange: (Double) -> Void
    var onDelete: () -> Void

    @State private var localWeight: Double
    @State private var showDeleteConfirm = false

    init(
        category: Category,
        sourceTypes: [String],
        onToggle: @escaping (Bool) -> Void,
        onSourceTypeChange: @escaping (String) -> Void,
        onWeightChange: @escaping (Double) -> Void,
        onDelete: @escaping () -> Void
    ) {
        self.category = category
        self.sourceTypes = sourceTypes
        self.onToggle = onToggle
        self.onSourceTypeChange = onSourceTypeChange
        self.onWeightChange = onWeightChange
        self.onDelete = onDelete
        _localWeight = State(initialValue: category.weight * 100)
    }

    private var categoryColors: (Color, Color) {
        CategoryColors.forCategory(category.name)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Name + toggle
            HStack {
                Circle()
                    .fill(categoryColors.0)
                    .frame(width: 10, height: 10)

                Text(category.name)
                    .font(.headline)
                    .foregroundStyle(.white)

                Spacer()

                Toggle("", isOn: Binding(
                    get: { category.isActive },
                    set: { onToggle($0) }
                ))
                .labelsHidden()
                .tint(Color.appPrimary)
            }

            // Source type picker
            HStack {
                Text("Source:")
                    .font(.caption)
                    .foregroundStyle(.gray)

                Picker("Source Type", selection: Binding(
                    get: { category.sourceType },
                    set: { onSourceTypeChange($0) }
                )) {
                    ForEach(sourceTypes, id: \.self) { type in
                        Text(type.capitalized).tag(type)
                    }
                }
                .pickerStyle(.menu)
                .tint(Color.appPrimaryLight)
            }

            // Weight slider
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("Weight")
                        .font(.caption)
                        .foregroundStyle(.gray)
                    Spacer()
                    Text("\(Int(localWeight))%")
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(Color.appPrimaryLight)
                }

                Slider(value: $localWeight, in: 0...100, step: 5) {
                    Text("Weight")
                } onEditingChanged: { editing in
                    if !editing {
                        onWeightChange(localWeight / 100.0)
                    }
                }
                .tint(categoryColors.0)
            }

            // Delete button
            HStack {
                Spacer()
                Button(role: .destructive) {
                    showDeleteConfirm = true
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "trash")
                            .font(.caption)
                        Text("Remove")
                            .font(.caption)
                    }
                    .foregroundStyle(.red.opacity(0.8))
                }
                .frame(height: 44)
                .confirmationDialog(
                    "Remove \(category.name)?",
                    isPresented: $showDeleteConfirm,
                    titleVisibility: .visible
                ) {
                    Button("Remove", role: .destructive) { onDelete() }
                    Button("Cancel", role: .cancel) {}
                }
            }
        }
        .padding(16)
        .background(Color.appSurface)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(categoryColors.0.opacity(0.2), lineWidth: 1)
        )
        .opacity(category.isActive ? 1.0 : 0.6)
    }
}
