# FAF Smart Handler - Just type 'faf'
# Shows status + next action automatically

Output "faf-smart-handler.gif"

Set FontSize 18
Set Width 800
Set Height 400
Set Theme "Dracula"
Set Padding 20
Set TypingSpeed 35ms

# In project directory
Type "cd /tmp/demo-project"
Enter
Sleep 300ms

Type "# Just type 'faf' - no command needed!"
Enter
Sleep 500ms

Type "faf"
Enter
Sleep 3s

Type ""
Enter
Type "# Shows score + suggests next action"
Enter
Type "# Try: faf go"
Enter
Sleep 2s
