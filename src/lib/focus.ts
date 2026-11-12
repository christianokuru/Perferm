/**
 * After a failed submit, move focus (and the viewport) to the first invalid
 * field. Runs after React commits the error state, so it finds the new
 * `aria-invalid` attributes. Essential on mobile where errors may be off-screen.
 */
export function focusFirstError(root: ParentNode = document): void {
  requestAnimationFrame(() => {
    const field = root.querySelector<HTMLElement>("[aria-invalid=true]");
    if (!field) return;
    field.scrollIntoView({ block: "center", behavior: "smooth" });
    field.focus({ preventScroll: true });
  });
}
