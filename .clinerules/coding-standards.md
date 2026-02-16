# Quality Assurance
- Be sure to remove unused imports from files before saving
- **NEVER** commit files containing Git merge conflict markers (<<<<<<<, =======, >>>>>>>). Always verify file content and run a local build/test before pushing.
- **ALWAYS** use absolute path aliases @/ for file imports and not relative ../ paths

# UI Standards
- Use MUI components to create components - follow latest documentation: https://mui.com/material-ui/all-components/
- Remember the Grid component from MUI does not have an item prop and for sizing it uses a "size" prop object ie: size={{sm:12,md:6}}. This applies to all usages of Grid, including nested Grids. Ensure consistent application of this prop for responsive layouts.

# Project Management
- when creating sprints each task should be numbered
- when creating commits - prefix the commit message with the sprint number and task number as well as a task type eg(fix, feat, chore, doc) etc.
- a sprintX.md file must be created for every sprint. You will plan with the developer on what the sprint will focus on and create appropriate tasks for that sprint. Commits will be created for each task to make it easier to track changes and progress. Do not commit anything or mark sprints completed until the developer gives you permission.

# Testing
- New features or changes to existing features should include testing both unit tests and integration tests for flows. Aim for >85% code coverage on tests.
- After making updates to existing features make sure the revelant changes are made to related test files and there are no broken tests.


# Supabase
You should have MCP access to Supabase (project ID: wbkpofmvjcmdqbivocqc) to verify backend configuration. If you cannot access you should inform the developer.