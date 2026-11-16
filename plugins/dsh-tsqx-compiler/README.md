# TSQX Compiler for DeepSeek Harness

Install the `dsh-tsqx-compiler-*.tgz` package from the [GitHub release](https://github.com/YZDame/tsqx-compiler/releases/latest). In the Desktop plugin manager, use **Add plugin** and paste the tarball URL. For CLI profiles, download it and run:

```sh
dsh plugin --profile tui add ./dsh-tsqx-compiler-0.1.0.tgz
```

Start the same profile and ask, for example, “Create a TSQX figure for a triangle and its incircle, then compile it to PDF.” The plugin provides the **tsqx-compiler** skill and the **tsqx_snippets** tool with the same snippets and figure templates as the VS Code extension. The skill compiles through the session’s shell tool and returns the ASY and PDF paths with structured diagnostics. Compilation requires `node`, `tsqx`, and Asymptote (`asy`) on the shell PATH. The compiler writes next to the source file.
