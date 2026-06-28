## Create Your First Scene

Create a new manimgl scene file:

- Open the Command Palette (`Ctrl+Shift+P`)
- Run **ManimGL: Create New Scene File**
- Enter a file name (e.g., `my_first_scene.py`)

A template will be generated:

```python
from manimlib import *

class MyScene(Scene):
    def construct(self):
        circle = Circle()
        circle.set_fill(BLUE, opacity=0.5)
        self.play(ShowCreation(circle))
        self.wait()
```

### Run the Scene

You'll see **CodeLens** links above the class definition:

- Click **▶ Run Scene** to preview in the interactive window
- Click **🎬 Export Scene** to render a video file

### Iterative Development with Checkpoints

Add checkpoint comments to your code, then click **▶ Run from: ...** above them:

```python
from manimlib import *

class MyScene(Scene):
    def construct(self):
        # setup: create background
        bg = Rectangle(width=14, height=8, fill_color=BLACK, fill_opacity=1)
        self.add(bg)

        # animation: draw circle
        circle = Circle()
        self.play(ShowCreation(circle))
```

The checkpoint code will be copied to your clipboard and manimgl will launch in interactive mode — just **paste** (`Ctrl+V`) into the manimgl window to see that section!
