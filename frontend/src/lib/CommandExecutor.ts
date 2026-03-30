import { CopilotAction } from '../platform/core/types';

interface Dispatcher {
    addNode: (type: string, props: Record<string, unknown>, parentId: string | null, index: number | null) => void;
    updateNode: (id: string, path: string, value: unknown) => void;
    deleteNode: (id: string) => void;
}

export const executeCopilotCommands = (commands: CopilotAction[], dispatcher: Dispatcher, targetNodeId: string | null) => {
    commands.forEach((command) => {
        try {
            switch (command.action) {
                case 'addNode':
                    if (command.type) {
                        // The `addNode` function in BuilderContext handles generating the unique UUID
                        dispatcher.addNode(command.type, command.props || {}, targetNodeId, null);
                    } else {
                        console.warn("[Copilot] Skipping addNode: Missing 'type' property.");
                    }
                    break;

                case 'updateNode':
                case 'updateProps': // Alias for robust handling
                    if (command.id && command.props) {
                        Object.entries(command.props).forEach(([key, value]) => {
                            dispatcher.updateNode(command.id as string, `props.${key}`, value);
                        });
                    } else {
                        console.warn("[Copilot] Skipping updateNode/updateProps: Missing 'id' or 'props'.");
                    }
                    break;

                case 'updateStyle':
                    if (command.id && command.props) {
                        Object.entries(command.props).forEach(([key, value]) => {
                            dispatcher.updateNode(command.id as string, `styles.${key}`, value);
                        });
                    } else {
                        console.warn("[Copilot] Skipping updateStyle: Missing 'id' or 'props'.");
                    }
                    break;

                case 'removeNode':
                    if (command.id) {
                        dispatcher.deleteNode(command.id);
                    } else {
                        console.warn("[Copilot] Skipping removeNode: Missing 'id'.");
                    }
                    break;

                default:
                    console.warn(`[Copilot] Unknown action type: ${command.action}`);
                    break;
            }
        } catch (error) {
            console.error(`[Copilot] Failed to execute action ${command.action}`, error, command);
        }
    });
};
