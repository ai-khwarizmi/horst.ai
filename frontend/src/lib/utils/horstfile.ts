import { sha256 } from 'js-sha256';
import { v4 as uuidv4 } from 'uuid';
import SuperJSON from 'superjson';
import localforage from 'localforage';

if (typeof window !== 'undefined') {
	localforage.config({
		driver: localforage.INDEXEDDB,
		name: 'horst.ai',
		version: 1.0,
		storeName: 'horst.ai',
	});
}

export class HorstFile {
	id: string;
	fileName: string;
	fileSize: number;
	fileType: string;
	timeUploaded: number = Date.now();

	private fileDataBase64: string | null = null;
	private fileArrayBuffer: ArrayBuffer | null = null;
	private fileHash: string | null = null;

	private loaded = false;
	private onLoadPromises: { resolve: (file: HorstFile) => void }[] = [];

	constructor(fileOrId: File | string, callback?: (file: HorstFile) => void) {
		if (typeof fileOrId === 'string') {
			this.id = fileOrId;
			this.fileName = '';
			this.fileSize = 0;
			this.fileType = '';
			this.loadFromStorage();
		} else {
			this.id = uuidv4().toString();
			this.fileName = fileOrId.name;
			this.fileSize = fileOrId.size;
			this.fileType = fileOrId.type;
			this.readFile(fileOrId, callback);
		}
	}

	private async onLoad(callback?: (file: HorstFile) => void) {
		this.loaded = true;
		if (callback) {
			callback(this);
		}
		this.onLoadPromises.forEach(({ resolve }) => {
			resolve(this);
		});
		this.onLoadPromises = [];
		await this.saveToStorage();
	}

	public async waitForLoad() {
		if (this.loaded) {
			return this;
		}
		return new Promise<HorstFile>((resolve) => {
			this.onLoadPromises.push({ resolve: resolve as any });
		});
	}

	async readFile(file: File, callback?: (file: HorstFile) => void) {
		this.fileArrayBuffer = await this.readFileAsArrayBuffer(file);
		this.fileDataBase64 = await this.readFileAsBase64();
		this.fileHash = sha256(new Uint8Array(this.fileArrayBuffer));
		this.onLoad(callback);
	}

	private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => {
				const arrayBuffer = reader.result as ArrayBuffer;
				resolve(arrayBuffer);
			};
			reader.onerror = reject;
			reader.readAsArrayBuffer(file);
		});
	}

	private readFileAsBase64(): Promise<string> {
		return new Promise((resolve, reject) => {
			if (this.fileArrayBuffer) {
				const binaryString = this.arrayBufferToBinaryString(this.fileArrayBuffer);
				resolve(btoa(binaryString));
			} else {
				reject(new Error("File data not initialized"));
			}
		});
	}

	private arrayBufferToBinaryString(buffer: ArrayBuffer): string {
		let binary = '';
		const bytes = new Uint8Array(buffer);
		const len = bytes.byteLength;
		for (let i = 0; i < len; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return binary;
	}

	getHash(): string {
		if (!this.fileHash) {
			throw new Error("File hash not initialized");
		}
		return this.fileHash;
	}

	getDataUrl(): string {
		return `data:${this.fileType};base64,${this.fileDataBase64}`;
	}

	getAsFileAttachment(): string {
		if (!this.fileArrayBuffer) {
			throw new Error("File data not initialized");
		}
		const fileContent = new TextDecoder().decode(this.fileArrayBuffer);
		return `
<FILE_ATTACHMENT>
<FILE_NAME>
${this.fileName}
</FILE_NAME>
<FILE_CONTENT>
${fileContent}
</FILE_CONTENT>
</FILE_ATTACHMENT>
`;
	}

	getFileText(): string {
		if (!this.fileDataBase64) {
			throw new Error("File data not initialized");
		}
		return atob(this.fileDataBase64);
	}

	getBlob(): Blob {
		if (!this.fileDataBase64) {
			throw new Error("File data not initialized");
		}
		const binaryString = atob(this.fileDataBase64);
		const len = binaryString.length;
		const bytes = new Uint8Array(len);
		for (let i = 0; i < len; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		return new Blob([bytes], { type: this.fileType });
	}

	getFileBase64(): string {
		if (!this.fileDataBase64) {
			throw new Error("File data not initialized");
		}
		return this.fileDataBase64;
	}

	async saveToStorage(): Promise<void> {

		if (!this.fileDataBase64 || !this.fileHash) {
			throw new Error("File data or hash is missing");
		}

		const fileData = {
			id: this.id,
			fileName: this.fileName,
			fileSize: this.fileSize,
			fileType: this.fileType,
			timeUploaded: this.timeUploaded,
			fileDataBase64: this.fileDataBase64,
			fileHash: this.fileHash
		};

		try {
			await localforage.setItem(this.id, fileData);
		} catch (error) {
			console.error("Error in saveToStorage:", error);
			throw new Error(`Failed to save file with id ${this.id} to storage`);
		}
	}

	async loadFromStorage() {
		try {
			const data = await localforage.getItem<ReturnType<HorstFile['toJSON']>>(this.id);
			if (data) {
				this.id = data.id;
				this.fileName = data.fileName;
				this.fileSize = data.fileSize;
				this.fileType = data.fileType;
				this.timeUploaded = data.timeUploaded;
				this.fileDataBase64 = data.fileDataBase64;
				this.fileHash = data.fileHash;
				if (this.fileDataBase64) {
					this.fileArrayBuffer = this.base64ToArrayBuffer(this.fileDataBase64);
				}
			} else {
				console.error(`File with id ${this.id} not found in storage`);
			}
		} catch (error) {
			console.error("Error in loadFromStorage:", error);
			throw new Error(`Error loading file with id ${this.id} from storage`);
		}
		this.onLoad();
	}

	private base64ToArrayBuffer(base64: string): ArrayBuffer {
		const binaryString = atob(base64);
		const len = binaryString.length;
		const bytes = new Uint8Array(len);
		for (let i = 0; i < len; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		return bytes.buffer;
	}

	toJSON() {
		return {
			id: this.id,
			fileName: this.fileName,
			fileSize: this.fileSize,
			fileType: this.fileType,
			timeUploaded: this.timeUploaded,
			fileDataBase64: this.fileDataBase64,
			fileHash: this.fileHash
		};
	}

	toSimpleJson() {
		return {
			id: this.id,
		};
	}

	static async fromJSON(obj: any): Promise<HorstFile> {
		if (obj.fileDataBase64) {
			// Full data is included, create HorstFile directly
			const file = new HorstFile(obj.id);
			Object.assign(file, obj);
			file.fileArrayBuffer = file.base64ToArrayBuffer(obj.fileDataBase64);
			return file;
		} else {
			// Only ID is included, load from IndexedDB
			const file = new HorstFile(obj.id);
			await file.loadFromStorage();
			return file;
		}
	}

	static async fromFile(file: File): Promise<HorstFile> {
		return new Promise((resolve) => {
			new HorstFile(file, (file) => resolve(file));
		});
	}

	static async fromUrl(url: string): Promise<HorstFile> {
		const response = await fetch(url);
		const blob = await response.blob();
		const contentDisposition = response.headers.get('Content-Disposition');
		let fileName = "downloadedFile";
		if (contentDisposition && contentDisposition.includes('filename=')) {
			fileName = contentDisposition.split('filename=')[1].split(';')[0].trim();
		}
		const file = new File([blob], fileName, { type: blob.type });
		return HorstFile.fromFile(file);
	}

	isImage(): boolean {
		return this.fileType.startsWith('image/');
	}
}

export const fullSuperJSON = new SuperJSON();
fullSuperJSON.registerCustom<HorstFile, ReturnType<HorstFile['toJSON']>>(
	{
		isApplicable: (v): v is HorstFile => v instanceof HorstFile,
		serialize: (v) => v.toJSON(),
		deserialize: (v) => {
			const file = new HorstFile(v.id);
			Object.assign(file, v);
			return file;
		},
	},
	'HorstFile'
);

export const minimalSuperJSON = new SuperJSON();
minimalSuperJSON.registerCustom<HorstFile, ReturnType<HorstFile['toSimpleJson']>>(
	{
		isApplicable: (v): v is HorstFile => v instanceof HorstFile,
		serialize: (v) => v.toSimpleJson(),
		deserialize: (v) => new HorstFile(v.id),
	},
	'HorstFile'
);