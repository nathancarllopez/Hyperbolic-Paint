# Hyperbolic-Paint

This youtube tutorial gave me a lot of help when building the design and function of the toolbars:
https://www.youtube.com/watch?v=wCwKkT1P7vY

I used W3 schools tooltips page for the toolbar as well: https://www.w3schools.com/howto/howto_css_tooltip.asp

bugs to fix:

- polygons fill incorrectly at first/last edge. It's hard to tell exactly how it happens, but I believe a path is not being closed properly when ctx.fill() is called.

To do:

Next steps:

- Add mobius transformations to be able to transform the plane and the shapes

- Add free drawing tool

- Make everything mobile friendly