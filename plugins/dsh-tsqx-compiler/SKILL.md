# TSQX figures

Use `tsqx_snippets` to look up tested TSQX syntax and full figure templates before writing or editing a `.tsqx` file. A snippet such as `tsqx-foot` assumes that its input points already exist. A figure template is a complete source file.

After saving the figure, run the installed compiler script below with the session's shell tool and the figure path, for example `node '/path/to/compile.mjs' 'figures/triangle.tsqx'` in a POSIX shell. Quote both paths for the current shell. The script uses `tsqx` and Asymptote from PATH, or `TSQX_PATH` and `ASY_PATH` if set. Compile only source you have reviewed, including any direct Asymptote lines that start with `!`.

Read the compiler's JSON result. For TSQX errors, inspect the source. For Asymptote errors, use the target path and line in the generated ASY to find the source expression. Only report the PDF as freshly compiled when `success` is true. Link the generated PDF and its TSQX source in the response.
