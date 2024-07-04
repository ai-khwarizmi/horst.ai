import { sha256 } from 'js-sha256';

export class HorstFile {
	public readonly fileName: string;
	public readonly fileSize: number;
	public readonly fileType: string;

	//private because it may not be initialized. Don't change this. Use getFileData() instead.
	private fileDataBase64: string | null = null;
	private fileArrayBuffer: ArrayBuffer | null = null;
	private fileHash: string | null = null;

	constructor(file: File, callback: (file: HorstFile) => void) {
		if (!file || !callback) {
			throw new Error("File and callback are required");
		}
		this.fileName = file.name;
		this.fileSize = file.size;
		this.fileType = file.type;
		// Read the file
		this.readFile(file, callback);
	}

	async readFile(file: File, callback: (file: HorstFile) => void) {
		this.fileArrayBuffer = await this.readFileAsArrayBuffer(file);
		this.fileDataBase64 = await this.readFileAsBase64();
		this.fileHash = sha256(new Uint8Array(this.fileArrayBuffer));
		callback(this);
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
}
