# chord
A crusty library I wrote to tile windows on my laptop that I only just realized I should have named arpeggio.

I got annoyed trying to learn i3 but still wanted to be able to tile my windows using keystrokes, so I wrote this instead. Basically everything is hard coded, but I'm throwing it up here in case it's interesting or useful to anyone.

To get this to run, you need to map four keys (I use F9-F12) to call keypress.sh with the numbers 1-4 as arguments. Then pressing these keys will tile the first four windows in your workspace into an arrangement that I personally think looks nice.

You can override it using the first four windows by also hooking up keyregister.sh to four keys (I use alt+F9-F12).
