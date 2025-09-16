# Core Components

## Purpose
Essential components that are fundamental to the platform's operation. These components:
- Cannot be disabled via feature flags
- Are required for basic functionality
- Have the highest stability requirements
- Should rarely change

## What Belongs Here
- Authentication components
- Basic navigation and layout
- Essential AI chat interface
- Core course management
- Security-critical components
- Error boundaries and fallbacks

## Guidelines
- **Stability**: Changes must be thoroughly tested
- **Dependencies**: Minimize external dependencies
- **Breaking Changes**: Require major version bump
- **Documentation**: Must be comprehensive
- **Testing**: Require 80%+ test coverage

## Current Core Components
- `Chat/` - AI chat interface (when moved)
- `Auth/` - Authentication flows (when moved)
- `Layout/` - App structure (when moved)
- `ErrorBoundary/` - Error handling (when moved)

## Migration Plan
Components will be gradually moved here from the main components folder based on stability and importance.