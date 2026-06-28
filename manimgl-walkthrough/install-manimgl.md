## Install manimgl in Editable Mode

Once you have cloned the repository, install manimgl in "editable" (development) mode:

```bash
cd manim
pip install -e .
```

The `-e` flag installs the package in **editable mode**, so any updates you pull from git will be immediately available without reinstalling.

> **Note:** Make sure you're using the Python interpreter that VS Code is configured to use. Run `pip show manimgl` to verify the installation path.
