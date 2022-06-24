# Attribute Grammar Tutor


The Attribute Grammar Tutor helps students of the Compiler Construction course practice:
- drawing the local dependency graph
- performing the strong acyclicity algorithm

For more information on this topic, check this book: [Compiler Design - Syntactic and Semantic Analysis](https://link.springer.com/book/10.1007/978-3-642-17540-4).


## Provide attribute grammars

It is possible to provide attribute grammars to the users, which they can then select and load from a menu.

In order to do that, it is necessary to create (if it doesn't exist already) the file `attribute_grammars.json` in the root. The syntax of that file is the following.

```
[
  {
    "title": "Attribute Grammar Example 1",
    "productionRules": [
      "production rule 1",
      "production rule 2",
      ...
    ]
  },
  
  ...
]
```

After specifying some new attribute grammar, in order to check, that the syntax is correct, you can launch the site and open the `Load attribute grammar` menu. In case of any problem with the JSON file, the menu will not load any grammar and instead show a warning message.


## Launch the tutor

### On a server

If you copy this project to a server and open

`https://yourdomain/your-attribute-grammar-tutor-folder/` 

or

`https://yourdomain/your-attribute-grammar-tutor-folder/index.html`

everything should work fine right away!

Alternatively you can also host it on your GitHub, using GitHub Pages, like it is being done here.

### Locally

Because this project uses JavaScript modules, cloning it to your local folder and opening `index.html` will not work. You have to run it on a server.

One way to run a local web server is to use [Live Server](https://www.npmjs.com/package/live-server). Check their website for the documentation.
But if you are using a terminal and you have [Node.js](https://nodejs.org/en/) installed, you can run the following.

```
# Install the Live Server from npm 
npm install live-server -g

# Go to the folder with the Attribute Grammar Tutor
cd ./path/to/grammar/tutor/

# Launch the local web server
# This should automatically open a web browser window on:
# http://127.0.0.1:8080/  or
# http://localhost:8080/
live-server .
```