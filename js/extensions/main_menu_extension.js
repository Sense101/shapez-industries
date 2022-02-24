import { MODS } from "shapez/mods/modloader";
import { T } from "shapez/translations";

export const MainMenuExtension = ({ $old }) => ({
    onPlayButtonClicked() {
        this.app.analytics.trackUiClick("startgame");

        const signals = this.dialogs.showInfo(
            "New Shapez Industries Save",
            "Shapez Industries is designed to be played after you have reached freeplay in the base game, as the mod assumes you already know the base mechanics.<br><br>\
            If you've not finished the base game, I advise you play that first.",
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
            if (
                mod.name == "Shapez Industries" &&
                !difference.missing.find(m => m.name == "Shapez Industries")
            ) {
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
