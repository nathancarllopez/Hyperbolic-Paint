# Hyperbolic-Paint

This youtube tutorial gave me a lot of help when building the design and function of the toolbars:
https://www.youtube.com/watch?v=wCwKkT1P7vY

I used W3 schools tooltips page for the toolbar as well: https://www.w3schools.com/howto/howto_css_tooltip.asp

bugs to fix:
- Opening/closing dev tools causes the coordinates of the mouse cursor appear in the wrong place. Refreshing fixes the issue

- Line segments switch to drawing in the wrong orientation when one anchor is dragged around the other

- polygons sometimes fill incorrectly, but it's hard to reproduce. It seems that triangles fill fine, but more than three vertices is weird. Update: it looks like having obtuse angles is the issue... or maybe not, jeez.

To do:

- Add undo functionality

- Create introductory text (maybe in a collapsible section, or off to the left side?)

