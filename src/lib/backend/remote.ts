import { BackendError } from "./errors";

export class UnavailableRemoteAdapter {
  private unavailable(): never { throw new BackendError("unavailable", "Remote backend is not configured"); }
  currentUser(): Promise<never> { return Promise.reject(this.unavailable()); }
  signOut(): Promise<never> { return Promise.reject(this.unavailable()); }
  get(): Promise<never> { return Promise.reject(this.unavailable()); }
  save(): Promise<never> { return Promise.reject(this.unavailable()); }
  clear(): Promise<never> { return Promise.reject(this.unavailable()); }
  sync(): Promise<never> { return Promise.reject(this.unavailable()); }
}
