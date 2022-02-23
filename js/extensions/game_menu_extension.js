import { makeDiv } from "shapez/core/utils";
import { DynamicDomAttach } from "shapez/game/hud/dynamic_dom_attach";
import { enumNotificationType } from "shapez/game/hud/parts/notifications";
import { KEYMAPPINGS } from "shapez/game/key_action_mapper";
import { SOUNDS } from "shapez/platform/sound";
import { T } from "shapez/translations";

export const GameMenuExtension = ({ $old }) => ({
    createElements(parent) {
        this.element = makeDiv(parent, "ingame_HUD_GameMenu");

        const buttons = [
            {
                id: "research",
                label: "Research",
                // @ts-ignore
                handler: () => this.root.hud.parts.research.show(),
                visible: () => this.root.hubGoals.level > 9,
                badge: () => this.root.hud.parts.research.getAvailableResearch(),
                showBadgeNumber: true,
            },
            {
                id: "shop",
                label: "Upgrades",
                // @ts-ignore
                handler: () => this.root.hud.parts.shop.show(),
                keybinding: KEYMAPPINGS.ingame.menuOpenShop,
                badge: () => this.root.hubGoals.getAvailableUpgradeCount(),
                notification: /** @type {[string, enumNotificationType]} */ ([
                    T.ingame.notifications.newUpgrade,
                    enumNotificationType.upgrade,
                ]),
                visible: () => this.root.hubGoals.level > 3,
            },
            {
                id: "stats",
                label: "Stats",
                // @ts-ignore
                handler: () => this.root.hud.parts.statistics.show(),
                keybinding: KEYMAPPINGS.ingame.menuOpenStats,
                visible: () =>
                    !this.root.app.settings.getAllSettings().offerHints || this.root.hubGoals.level >= 3,
            },
        ];

        /** @type {Array<{
         * badge: function,
         * button: HTMLElement,
         * badgeElement: HTMLElement,
         * lastRenderAmount: number,
         * condition?: function,
         * notification: [string, enumNotificationType]
         * }>} */
        this.badgesToUpdate = [];

        /** @type {Array<{
         * button: HTMLElement,
         * condition: function,
         * domAttach: DynamicDomAttach
         * }>} */
        this.visibilityToUpdate = [];

        // @ts-ignore
        buttons.forEach(
            ({ id, label, handler, keybinding, badge, notification, visible, showBadgeNumber }) => {
                const button = document.createElement("button");
                button.classList.add(id);
                this.element.appendChild(button);
                this.trackClicks(button, handler);

                if (keybinding) {
                    const binding = this.root.keyMapper.getBinding(keybinding);
                    binding.add(handler);
                }

                if (visible) {
                    this.visibilityToUpdate.push({
                        button,
                        condition: visible,
                        domAttach: new DynamicDomAttach(this.root, button),
                    });
                }

                if (badge) {
                    const badgeElement = makeDiv(button, null, ["badge"]);
                    this.badgesToUpdate.push({
                        badge,
                        lastRenderAmount: 0,
                        button,
                        badgeElement,
                        notification,
                        condition: visible,
                        showBadgeNumber,
                    });
                }
            }
        );

        this.saveButton = makeDiv(this.element, null, ["button", "save", "animEven"]);
        this.settingsButton = makeDiv(this.element, null, ["button", "settings"]);

        this.trackClicks(this.saveButton, this.startSave);
        this.trackClicks(this.settingsButton, this.openSettings);
    },

    update() {
        let playSound = false;
        let notifications = new Set();

        // Check whether we are saving
        this.trackedIsSaving.set(!!this.root.gameState.currentSavePromise);

        // Update visibility of buttons
        for (let i = 0; i < this.visibilityToUpdate.length; ++i) {
            const { condition, domAttach } = this.visibilityToUpdate[i];
            domAttach.update(condition());
        }

        // Check for notifications and badges
        for (let i = 0; i < this.badgesToUpdate.length; ++i) {
            const {
                badge,
                button,
                badgeElement,
                lastRenderAmount,
                notification,
                condition,
                showBadgeNumber,
            } = this.badgesToUpdate[i];

            if (condition && !condition()) {
                // Do not show notifications for invisible buttons
                continue;
            }

            // Check if the amount shown differs from the one shown last frame
            const amount = badge();
            if (lastRenderAmount !== amount) {
                if (amount > 0 && showBadgeNumber) {
                    badgeElement.innerText = amount;
                }
                // Check if the badge increased, if so play a notification
                if (amount > lastRenderAmount) {
                    playSound = true;
                    if (notification) {
                        notifications.add(notification);
                    }
                }

                // Rerender notifications
                this.badgesToUpdate[i].lastRenderAmount = amount;
                button.classList.toggle("hasBadge", amount > 0);
            }
        }

        if (playSound) {
            this.root.soundProxy.playUi(SOUNDS.badgeNotification);
        }

        notifications.forEach(([notification, type]) => {
            this.root.hud.signals.notification.dispatch(notification, type);
        });
    },
});
