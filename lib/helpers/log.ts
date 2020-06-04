import { ConsoleColor } from "../../deps.ts";

export function success(message: string) {
  console.log(ConsoleColor.green.text(message));
}

export function error(message: string) {
  console.log(ConsoleColor.red.text(message));
}

export function warning(message: string) {
  console.log(ConsoleColor.yellow.text(message));
}
