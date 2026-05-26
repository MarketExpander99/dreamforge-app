# Current UI Specifications

## ProminentTabs Component

### Rules
- **ProminentTabsTrigger** must use: `flex-1` + `min-w-[140px]`
- **ProminentTabsList** must use: `p-1` + `sm:flex-nowrap`
- **Remove completely**: `overflow-x-auto`, `scrollbar-hide`, `truncate`, `min-w-0`
- **Keep**: prominent button look (dark active state with shadow)

### Behavior
- All tabs have **exactly the same width** on desktop
- No shrinking, no overflow, no truncation
- Applied to Curriculum page and any other tabbed pages