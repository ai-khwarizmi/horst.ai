export class HorstFile {
	public readonly fileName: string;
	public readonly fileSize: number;
	public readonly fileType: string;

	//private because it may not be initialized. Don't change this. Use getFileData() instead.
	private fileData: string | null = null;

	constructor(file: File) {
		this.fileName = file.name;
		this.fileSize = file.size;
		this.fileType = file.type;
		// Read the file
		this.readFile(file)
	}

	async readFile(file: File) {
		this.fileData = await this.readFileAsBase64(file);
	}

	private readFileAsBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => {
				const arrayBuffer = reader.result as ArrayBuffer;
				const binaryString = this.arrayBufferToBinaryString(arrayBuffer);
				resolve(btoa(binaryString));
			};
			reader.onerror = reject;
			reader.readAsArrayBuffer(file);
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

	getFileData(): string {
		if (this.fileData === null) {
			throw new Error("File data not initialized");
		}
		return atob(this.fileData);
	}

	getFileBase64(): string {
		if (this.fileData === null) {
			throw new Error("File data not initialized");
		}
		return this.fileData;
	}

	static async fromFile(file: File): Promise<HorstFile> {
		const horstFile = new HorstFile(file);
		return horstFile;
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
