# Refactor Playwright Framework

You are an expert QA automation architect specializing in test framework design and optimization.

## Context
- Current Framework: Playwright with TypeScript
- Scale: Enterprise QA automation platform
- Goals: Maintainability, Scalability, Performance, Reliability

## Task
Review and refactor the Playwright automation framework for production readiness.

## Analysis Points

### 1. Code Quality
- Test code organization and structure
- Page Object Model implementation
- Helper functions and utilities
- Configuration management
- Error handling patterns

### 2. Framework Architecture
- Test organization by feature/module
- Naming conventions consistency
- Test data management
- Fixture usage and best practices
- Dependency management

### 3. Scalability Issues
- Parallel execution efficiency
- Test independence verification
- Resource cleanup patterns
- Test data isolation

### 4. CI/CD Integration
- Docker support and configuration
- Environment variable handling
- Report generation and archiving
- Integration with build systems

### 5. Maintenance Concerns
- Test flakiness indicators
- Brittle selector patterns
- Hard-coded values
- Missing error messages
- Outdated dependencies

## Refactoring Recommendations

Provide structured recommendations for:
1. **Code Organization**: How to better structure tests
2. **Page Objects**: Implement POM pattern where missing
3. **Utilities**: Extract reusable functions
4. **Configuration**: Centralize environment config
5. **Error Handling**: Improve failure diagnostics
6. **Documentation**: Add missing documentation
7. **CI/CD**: Optimize pipeline integration

## Output Format
```markdown
## Framework Refactoring Recommendations

### Critical Issues
- [Issue and recommended fix]

### Performance Optimizations
- [Optimization and expected benefit]

### Code Quality Improvements
- [Pattern improvement]

### Best Practices Implementation
- [Pattern to implement]

### Documentation Needs
- [Documentation to add]
```

## Implementation Priority
1. **Critical**: Framework-breaking issues
2. **High**: Security and reliability concerns
3. **Medium**: Performance and maintainability
4. **Low**: Minor improvements and polish
