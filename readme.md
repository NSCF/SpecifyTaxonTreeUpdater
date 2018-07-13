# Taxon import into Specify (with synonyms)

To start you need to install [Node.js](https://nodejs.org/en/). I used the LTS version.
You will also need [git](https://git-scm.com/downloads) if you don't have it already. 

Navigate to an appropriate directory, open a command window and run:
`>git clone https://ian_engelbrecht@bitbucket.org/ian_engelbrecht/specifytaxontreeupdater.git`
Then
`>cd specifytaxontreeupdater`
Then
`>npm install`
This will install all of the dependencies needed for the project. 

I've written the code to be run in a Node REPL instance (see [this tutorial](https://nodejs.org/api/repl.html) for help). The REPL is basically a Node command line interface. You copy and paste code into the REPL to get it to run. Valueable commands are:
* .editor: lets you paste multipe lines of code, especially if you break your function chaines onto new lines. Use Ctrl^D to end and run the code
* .clear or Ctrl^c: to break out of the current code if something goes wrong

The code to run is in `index.js`. 