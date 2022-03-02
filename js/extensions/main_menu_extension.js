import { MODS } from "shapez/mods/modloader";
import { T } from "shapez/translations";

const shapezIndustriesName = "Shapez Industries";

export const MainMenuExtension = ({ $old }) => ({
    onPlayButtonClicked() {
        this.app.analytics.trackUiClick("startgame");

        const signals = this.dialogs.showInfo(
            "New Shapez Industries Save",
            "Shapez Industries is designed to be played with a new save, but as the mod assumes you already know the basic mechanics, I advise you finish the base game first.<br><br>\
            Note that this is a complete revamp of the shapez.io experience,\
            using other mods will either break the game, or ruin the experience!",
            ["cancel:bad", "continue:good"]
        );

        signals.continue.add(() =>
            this.moveToState("InGameState", {
                savegame: this.app.savegameMgr.createNewSavegame(),
            })
        );
    },

    checkForModDifferences(savegame) {
        const difference = MODS.computeModDifference(savegame.currentData.mods);

        if (difference.missing.length === 0 && difference.extra.length === 0) {
            return Promise.resolve();
        }
        const upgradingSave =
            difference.missing.find(m => m.name == shapezIndustriesName) &&
            difference.extra.find(m => m.name == shapezIndustriesName);

        let dialogHtml = T.dialogs.modsDifference.desc;

        function formatMod(mod) {
            let html = `
            <div class="dialogModsMod">
                <div class="name">${mod.name}</div>
                <div class="version">${T.mods.version} ${mod.version}</div>
                <button class="website styledButton" onclick="window.open('${mod.website.replace(
                    /"'/,
                    ""
                )}')">${T.mods.modWebsite}
                </button>
            </div>
            `;
            if (mod.name == shapezIndustriesName) {
                if (upgradingSave) {
                    return `
                        <div class="dialogModsMod">
                            <div class="name">${mod.name}</div>
                            <div class="version" style="display:inline-block;background:green;border-radius:2px;color:white;margin-right:5px;text-align:center;padding:2px;">
                                ${T.mods.version} 
                                ${mod.version}
                                - updating is safe!
                            </div>
                            <button class="website styledButton" onclick="window.open('${mod.website.replace(
                                /"'/,
                                ""
                            )}')">${T.mods.modWebsite}
                            </button>
                        </div>
                    `;
                }
                html += `
                        <div style="background:red;border-radius:2px;color:white;padding:6px;">
                            WARNING: Shapez Industries is NOT designed to be added to existing savegames. Proceed at your own risk. I don't know what will happen and I don't care. <br><br>
                            ~ Sense101
                        </div>`;
            }
            return html;
        }

        if (difference.missing.length > 0) {
            dialogHtml += "<h3>" + T.dialogs.modsDifference.missingMods + "</h3>";
            dialogHtml += difference.missing.map(formatMod).join("<br>");
        }

        if (difference.extra.length > 0) {
            dialogHtml += "<h3>" + T.dialogs.modsDifference.newMods + "</h3>";
            dialogHtml += difference.extra.map(formatMod).join("<br>");
        }

        const signals = this.dialogs.showWarning(T.dialogs.modsDifference.title, dialogHtml, [
            "cancel:good",
            "continue:bad",
        ]);

        return new Promise(resolve => {
            //@ts-ignore
            signals.continue.add(resolve);
        });
    },
});
