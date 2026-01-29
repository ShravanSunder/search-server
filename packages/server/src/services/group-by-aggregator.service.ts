import type {
  GroupByClause,
  GroupedSearchResult,
  KeyRef,
  MetadataValue,
  SearchResultItem,
} from "@search-server/sdk";

export class GroupByAggregatorService {
  process(results: readonly SearchResultItem[], config: GroupByClause): GroupedSearchResult[] {
    // 1. Get grouping key(s)
    const groupKeys = this.normalizeKeys(config.keys);

    // 2. Group results by the key(s)
    const groups = this.groupResults(results, groupKeys);

    // 3. Apply aggregation (MinK or MaxK) within each group
    const processedGroups: GroupedSearchResult[] = [];

    for (const [groupValue, items] of groups) {
      const aggregated = this.applyAggregation(items, config.aggregate);

      processedGroups.push({
        groupKey: groupKeys.map((k) => k.field).join(","),
        groupValue,
        items: aggregated,
      });
    }

    return processedGroups;
  }

  private normalizeKeys(keys: GroupByClause["keys"]): KeyRef[] {
    if (Array.isArray(keys)) {
      return keys.map((k) => (typeof k === "object" ? k : { field: String(k) }));
    }
    return [keys as KeyRef];
  }

  private groupResults(
    results: readonly SearchResultItem[],
    keys: KeyRef[],
  ): Map<MetadataValue, SearchResultItem[]> {
    const groups = new Map<MetadataValue, SearchResultItem[]>();

    for (const item of results) {
      // Create composite key from all grouping fields
      const groupValue = this.getGroupValue(item, keys);
      if (groupValue === undefined) continue;

      const group = groups.get(groupValue) ?? [];
      group.push(item);
      groups.set(groupValue, group);
    }

    return groups;
  }

  private getGroupValue(item: SearchResultItem, keys: KeyRef[]): MetadataValue | undefined {
    if (keys.length === 1 && keys[0]) {
      return this.getFieldValue(item, keys[0].field) as MetadataValue | undefined;
    }

    // Composite key: join values with separator
    const values: (string | number | boolean)[] = [];
    for (const key of keys) {
      const value = this.getFieldValue(item, key.field);
      if (value === undefined) return undefined;
      values.push(value as string | number | boolean);
    }
    return JSON.stringify(values);
  }

  private getFieldValue(item: SearchResultItem, field: string): unknown {
    if (field === "#score") return item.score;
    if (field === "#distance") return item.distance;
    if (field === "#id") return item.id;
    return item.metadata?.[field];
  }

  private applyAggregation(
    items: SearchResultItem[],
    aggregate: GroupByClause["aggregate"],
  ): SearchResultItem[] {
    if ("$min_k" in aggregate) {
      const { keys, k } = aggregate.$min_k;
      return this.sortAndSlice(items, this.normalizeKeys(keys), "asc", k);
    }

    if ("$max_k" in aggregate) {
      const { keys, k } = aggregate.$max_k;
      return this.sortAndSlice(items, this.normalizeKeys(keys), "desc", k);
    }

    return items;
  }

  private sortAndSlice(
    items: SearchResultItem[],
    sortKeys: KeyRef[],
    direction: "asc" | "desc",
    k: number,
  ): SearchResultItem[] {
    const sorted = [...items].sort((a, b) => {
      for (const key of sortKeys) {
        const aVal = this.getFieldValue(a, key.field);
        const bVal = this.getFieldValue(b, key.field);

        // Handle undefined values
        if (aVal === undefined && bVal === undefined) continue;
        if (aVal === undefined) return direction === "asc" ? 1 : -1;
        if (bVal === undefined) return direction === "asc" ? -1 : 1;

        // Compare numeric values
        if (typeof aVal === "number" && typeof bVal === "number") {
          const diff = aVal - bVal;
          if (diff !== 0) {
            return direction === "asc" ? diff : -diff;
          }
        }

        // Compare string values
        if (typeof aVal === "string" && typeof bVal === "string") {
          const diff = aVal.localeCompare(bVal);
          if (diff !== 0) {
            return direction === "asc" ? diff : -diff;
          }
        }
      }
      return 0;
    });

    return sorted.slice(0, k);
  }
}
