export const PREPARE_MAP_PRINT_EVENT = "contingency-plan-prepare-map-print";

export function prepareMapForPrint(timeoutMs = 3000): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    window.dispatchEvent(
      new CustomEvent(PREPARE_MAP_PRINT_EVENT, { detail: { finish } })
    );

    window.setTimeout(finish, timeoutMs);
  });
}
