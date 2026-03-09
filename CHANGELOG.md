# Changelog

All notable changes to Shield are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added
- Unsaved changes confirmation when closing form modals
- In-flight cookie store for `getInspectionSession`
- Auto-retry on first OAuth callback failure with improved error UX
- Login hint passthrough to pre-fill email on Keycloak login
- Manage Access feature for system admins
- Bulk invitation creation with table UI
- Role overview table in member role assignment form
- Multi-client access system (client switching, access grants)
- Asset question detail form redesign with sectioned layout
- `ResponsiveModal` component (replaces `ResponsiveDialog`)

### Fixed
- Client switching data re-fetch and tag ownership form sync
- Client switcher on inspect register screen
- Client combobox for elevated access intent and non-system users
- Nested form submit events bubbling to parent product form
- Dialog-behind-popover stacking issues
- Accept invitation error reading from correct source
- Modal footer layout and form UX

### Changed
- Migrated all consumers from `ResponsiveDialog` to `ResponsiveModal`
- Extracted role components and simplified modal fetcher hook
- Users table access display improvements
