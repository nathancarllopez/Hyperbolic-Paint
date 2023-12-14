# Hyperbolic-Paint

This youtube tutorial gave me a lot of help when building the design and function of the toolbars:
https://www.youtube.com/watch?v=wCwKkT1P7vY

I used W3 schools tooltips page for the toolbar as well: https://www.w3schools.com/howto/howto_css_tooltip.asp

Bugs to fix:

- When translating and axis of translation is dragged and becomes a diameter, weird stuff happens. I think it has something to do with the way the endpoints of a geodesic are computed, so I should go and make sure that is consistent.

To do:

- (Optional) Repackage center of rotation and axis of translation for organizational purposes and DRY

- Style the Controls section. In particular, make the play and pause button one button that changes what it says from play to pause. Then center it, and maybe make it bigger?

Next steps:

- Add free drawing tool

- Add ability to click and drag the hyperbolic plane itself, i.e., when the plane is clicked and dragged, all shapes should move.

- Make everything mobile friendly