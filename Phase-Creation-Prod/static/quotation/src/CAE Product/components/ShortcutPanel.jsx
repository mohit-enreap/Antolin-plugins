import { shortcutConfig } from "../data/shortcust for Assy";
function ShortcutPanel({
    product,
    shortcutValues,
    updateShortcutLoops,
}) {
    console.log("CAE Product --> ", product);
    const shortcuts =
        shortcutConfig?.Product?.[product]?.ShortCuts || {};
    const shortcutsChecked =
        shortcutConfig?.Product?.[product]?.ShortCutsChecked || {};
    return (
        <div
            style={{
                background: "#fff",
                padding: "16px",
                borderRadius: "6px",
                marginBottom: "20px",
            }}
        >
            <h2>{product} Shortcuts for No of Comp</h2>
            <table>
                <tbody>
                    {Object.keys(shortcuts).map((shortcutName) => (
                        <tr key={shortcutName}>
                            <td>
                                <b>{shortcutName}</b>
                            </td>
                            <td>
                                <input
                                    type="number"
                                    min={0}
                                    value={shortcutValues[shortcutName] ?? 0}
                                    onChange={(e) =>
                                        updateShortcutLoops(
                                            shortcutName,
                                            Number(e.target.value)
                                        )
                                    }
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {product !== "Headliner" ? (
                <h2>{product} Shortcuts for Activity (Checked/Unchecked)    </h2>
            ) : null}
            <table>
                <tbody>
                    {Object.keys(shortcutsChecked).map((shortcutName) => (
                        <tr key={shortcutName}>
                            <td>
                                <b>{shortcutName}</b>
                            </td>

                            <td>
                                <select
                                    value={shortcutValues[shortcutName] ? "Yes" : "No"}
                                    onChange={(e) =>
                                        updateShortcutLoops(
                                            shortcutName,
                                            e.target.value === "Yes"
                                        )
                                    }
                                >
                                    <option value="No">No</option>
                                    <option value="Yes">Yes</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ShortcutPanel;
