export class Randomizer{
  private rand: () => number;

  constructor(seed: number = 12345) {
    this.rand = this.seededRandom(seed);
  }
  
  public getRandomNumber(){
    return this.rand();
  }
  
  public seededRandom(seed: number): () => number {
    let current = seed;
    return () => {
      current = (current * 9301 + 49297) % 233280;
      return current / 233280;
    };
  }

  public getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(this.rand() * arr.length)];
  }
  
  public getRandomItems<T>(arr: T[], count:number): T[] {
    if(count >= arr.length){
      return arr;
    }

    const max = Math.min(arr.length, count);
    const result: Set<T> = new Set<T>();
    for (let i = 0; result.size < max; i++) {
      result.add(this.getRandomItem(arr));
    }
    return [...result]
  }
  
  public getRandomFields(obj: object, fieldToSkip: string, maxCount: number = 7){
    const fields = this.getFields(obj, fieldToSkip);
    const fieldCountToUse = this.randomInt(2, maxCount);
    return this.getRandomItems(fields, fieldCountToUse);
  }

  public getRandomField(obj: object, fieldToSkip: string){
    const fields = this.getFields(obj, fieldToSkip);
    return this.getRandomItem(fields);
  }
  
  public getRandomNumbericField(obj: object, fieldToSkip: string){
    const fields = this.getFields(obj, fieldToSkip).filter(field => typeof obj[field] === 'number');
    return this.getRandomItem(fields);
  }
  
  private getFields(obj: object, fieldToSkip: string): string[]{
    return Object.keys(obj).filter((field) => field !== fieldToSkip && obj[field] !== null && obj[field] !== undefined);  
  }

  public randomInt(min: number, max: number): number {
    return Math.floor(this.rand() * (max - min + 1)) + min;
  }

  public randomFloat(min: number, max: number, decimals: number = 2): number {
    return Math.round((this.rand() * (max - min) + min) * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
  
  public generateDate(daysAgo: number = 365): string {
    const date = new Date();
    date.setDate(date.getDate() - this.randomInt(0, daysAgo));
    return date.toISOString().split("T")[0];
  }
}