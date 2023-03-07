set port=8092
start http://localhost:%port% 
title สýัง - %port%
mkdocs serve -a localhost:%port%
