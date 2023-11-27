import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from "@angular/router";
/*
shouldDetach – This determines if the route the user is leaving should save the component state.
store – This stores the detached route if the method above returns true.

shouldAttach – This determines if the route the user is navigating to should load the component state.
retrieve – This loads the detached route if the method above returns true.
*/

export class ZapdditRouteReuseStrategy implements RouteReuseStrategy {
  handlers = new Map<string, DetachedRouteHandle>();

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return (route.data['reuseComponent'] ?? false);
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    const key = this.getRouteKey(route);
    if(!this.handlers.has(key)){
      this.handlers.set(key, handle);
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return this.handlers.has(this.getRouteKey(route));
  }

  private getRouteKey(route: ActivatedRouteSnapshot): string {
    return route.pathFromRoot.filter(u => u.url).map(u => u.url).join('/');
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
     var result = this.handlers.get(this.getRouteKey(route));
     return result??null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    if (future.routeConfig === curr.routeConfig) {
      return future.data['reuseComponent'];
    } else {
      return false;
    }
  }

  public clearSavedHandle(key: string): void {
    const handle = this.handlers.get(key);
    if (handle) {
       //(handle as any).componentRef.destroy();
        this.handlers.delete(key);
    }
 }
}
