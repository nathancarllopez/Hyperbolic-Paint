# Hyperbolic-Paint

This youtube tutorial gave me a lot of help when building the design and function of the toolbars:
https://www.youtube.com/watch?v=wCwKkT1P7vY

I used W3 schools tooltips page for the toolbar as well: https://www.w3schools.com/howto/howto_css_tooltip.asp

bugs to fix:

- polygons sometimes fill incorrectly, but it's hard to reproduce. It seems that triangles fill fine, but more than three vertices is weird. Update: it looks like having obtuse angles is the issue... or maybe not, jeez. I think it's an orientation thing?

To do:

- Create introductory text (maybe in a collapsible section, or off to the left side?)

Next steps:

- Add mobius transformations to be able to transform the plane and the shapes

- Add free drawing tool
