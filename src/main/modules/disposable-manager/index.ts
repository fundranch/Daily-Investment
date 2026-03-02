import { injectable } from 'inversify';

export interface Disposable {
  dispose(): void;
}

@injectable()
export class DisposableManager {
    private disposables = new Set<Disposable>();

    register(disposable: Disposable) {
        this.disposables.add(disposable);
    }

    unregister(disposable: Disposable) {
        this.disposables.delete(disposable);
    }

    async disposeAll() {
        for(const disposable of this.disposables) {
            try {
                disposable.dispose();
            } catch(e) {
                console.error('Dispose error:', e);
            }
        }
        this.disposables.clear();
    }
}