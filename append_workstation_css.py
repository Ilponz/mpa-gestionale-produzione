# -*- coding: utf-8 -*-
css_additions = r'''
/* ==========================================================================
   MIGLIORIE PRATICHE WORKSTATION: FILTRI MORALI, PAN CAD & TASTI SIBLINGS
   ========================================================================== */

.btn-filter-morali.active {
  background: #FFFFFF !important;
  color: #000000 !important;
  border-color: #FFFFFF !important;
  font-weight: 700 !important;
}

.btn-quick-reassign-op {
  transition: all 120ms ease;
  user-select: none;
}

.btn-quick-reassign-op:hover {
  filter: brightness(1.2);
  transform: translateY(-1px);
}

.btn-nav-sibling-comp {
  transition: all 120ms ease;
}

.btn-nav-sibling-comp:hover:not(:disabled) {
  background: #FFFFFF !important;
  color: #000000 !important;
  border-color: #FFFFFF !important;
}

.workstation-cad-box {
  cursor: grab;
  user-select: none;
  overflow: hidden;
}

.workstation-cad-box:active {
  cursor: grabbing;
}
'''

with open('app/css/style.css', 'a', encoding='utf-8') as f:
    f.write(css_additions)

print("Appended workstation polish styles to style.css")
