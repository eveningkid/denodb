import { ConsoleColor } from "../../deps.ts";

export function success(message: string) {
  console.log(ConsoleColor.success(message));
}

export function error(message: string) {
  console.log(ConsoleColor.error(message));
}

export function warning(message: string) {
  console.log(ConsoleColor.warning(message));
}
