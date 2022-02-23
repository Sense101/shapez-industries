import { Loader } from "shapez/core/loader";
import { formatBigNumber, formatItemsPerSecond } from "shapez/core/utils";
import { enumDirection, Vector } from "shapez/core/vector";
import { MetaStorageBuilding } from "shapez/game/buildings/storage";
import { enumPinSlotType } from "shapez/game/components/wired_pins";
import { defaultBuildingVariant } from "shapez/game/meta_building";
import { StorageSystem } from "shapez/game/systems/storage";
import { ModInterface } from "shapez/mods/mod_interface";
import { T } from "shapez/translations";
import { newHubGoalRewards } from "../new_hub_goals";

export const miniStorageVariant = "mini";
const miniStorageSize = 500;

export const StorageExtension = ({ $old }) => ({
    getPreviewSprite(rotationVariant, variant) {
        return this.getSpriteFromLoader(rotationVariant, variant);
    },
    getSprite(rotationVariant, variant) {
        return this.getSpriteFromLoader(rotationVariant, variant);
    },
    getBlueprintSprite(rotationVariant, variant) {
        return this.getSpriteFromLoader(rotationVariant, variant, true);
    },
    getSpriteFromLoader(rotationVariant, variant, blueprint = false) {
        const basePath = blueprint ? "sprites/blueprints/" : "sprites/buildings/";

        return Loader.getSprite(
            basePath + this.id + (variant === defaultBuildingVariant ? "" : "-" + variant) + ".png"
        );
    },

    getAvailableVariants(root) {
        if (root.hubGoals.isRewardUnlocked(newHubGoalRewards.reward_mini_storage)) {
            return [defaultBuildingVariant, miniStorageVariant];
        }
        return [defaultBuildingVariant];
    },

    updateVariants(entity, rotationVariant, variant) {
        if (variant == miniStorageVariant) {
            entity.components.Storage.maximumStorage = miniStorageSize;

            entity.components.ItemAcceptor.setSlots([
                {
                    pos: new Vector(0, 0),
                    direction: enumDirection.bottom,
                },
            ]);

            entity.components.ItemEjector.setSlots([
                {
                    pos: new Vector(0, 0),
                    direction: enumDirection.top,
                },
                {
                    pos: new Vector(0, 0),
                    direction: enumDirection.right,
                },
            ]);

            entity.components.WiredPins.slots = [
                {
                    pos: new Vector(0, 0),
                    direction: enumDirection.right,
                    type: enumPinSlotType.logicalEjector,
                },
                {
                    pos: new Vector(0, 0),
                    direction: enumDirection.left,
                    type: enumPinSlotType.logicalEjector,
                },
            ];
        } else {
            entity.components.Storage.maximumStorage = 5000;

            entity.components.ItemAcceptor.setSlots([
                {
                    pos: new Vector(0, 1),
                    direction: enumDirection.bottom,
                },
                {
                    pos: new Vector(1, 1),
                    direction: enumDirection.bottom,
                },
            ]);

            entity.components.ItemEjector.setSlots([
                {
                    pos: new Vector(0, 0),
                    direction: enumDirection.top,
                },
                {
                    pos: new Vector(1, 0),
                    direction: enumDirection.top,
                },
            ]);

            entity.components.WiredPins.slots = [
                {
                    pos: new Vector(1, 1),
                    direction: enumDirection.right,
                    type: enumPinSlotType.logicalEjector,
                },
                {
                    pos: new Vector(0, 1),
                    direction: enumDirection.left,
                    type: enumPinSlotType.logicalEjector,
                },
            ];
        }
    },
});

// ------------------------------------------ //

/**
 * @param {ModInterface} modInterface
 */
export function addSmallerDrawForMini(modInterface) {
    modInterface.replaceMethod(StorageSystem, "drawChunk", function ($original, [parameters, chunk]) {
        const contents = chunk.containedEntitiesByLayer.regular;
        for (let i = 0; i < contents.length; ++i) {
            const entity = contents[i];
            const storageComp = entity.components.Storage;
            if (!storageComp) {
                continue;
            }

            const storedItem = storageComp.storedItem;
            if (!storedItem) {
                continue;
            }

            if (this.drawnUids.has(entity.uid)) {
                continue;
            }

            this.drawnUids.add(entity.uid);

            const staticComp = entity.components.StaticMapEntity;

            const miniStorage = storageComp.maximumStorage == miniStorageSize;

            if (miniStorage) {
                const context = parameters.context;
                context.globalAlpha = storageComp.overlayOpacity;
                const center = staticComp.getTileSpaceBounds().getCenter().toWorldSpace();
                storedItem.drawItemCenteredClipped(center.x + 0.2, center.y - 0.3, parameters, 16);

                this.storageOverlaySprite.drawCached(parameters, center.x - 10, center.y + 11, 20, 10);

                if (parameters.visibleRect.containsCircle(center.x, center.y + 25, 20)) {
                    context.font = "bold 6px GameFont";
                    context.textAlign = "center";
                    context.fillStyle = "#64666e";
                    context.fillText(formatBigNumber(storageComp.storedCount), center.x, center.y + 17);
                    context.textAlign = "left";
                }
                context.globalAlpha = 1;
                continue;
            }

            const context = parameters.context;
            context.globalAlpha = storageComp.overlayOpacity;
            const center = staticComp.getTileSpaceBounds().getCenter().toWorldSpace();
            storedItem.drawItemCenteredClipped(center.x, center.y, parameters, 30);

            this.storageOverlaySprite.drawCached(parameters, center.x - 15, center.y + 15, 30, 15);

            if (parameters.visibleRect.containsCircle(center.x, center.y + 25, 20)) {
                context.font = "bold 10px GameFont";
                context.textAlign = "center";
                context.fillStyle = "#64666e";
                context.fillText(formatBigNumber(storageComp.storedCount), center.x, center.y + 25.5);
                context.textAlign = "left";
            }
            context.globalAlpha = 1;
        }
    });
}

// --------------------------------- //

/**
 * @param {ModInterface} modInterface
 */
export function addNewStorageVariants(modInterface) {
    modInterface.addVariantToExistingBuilding(
        //@ts-ignore
        MetaStorageBuilding,
        miniStorageVariant,
        {
            name: "Storage (Mini)",
            description: "Stores excess items, prioritizing the top output. Best used as an overflow gate",
            dimensions: new Vector(1, 1),
            additionalStatistics(root) {
                return [[T.ingame.buildingPlacement.infoTexts.storage, formatBigNumber(miniStorageSize)]];
            },
        }
    );
}
