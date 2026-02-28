import { DataRecord } from "../types";

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
  
  public getUniqueFieldsAndValues(values: DataRecord[], count: number, fieldToSkip?: string): Map<string, DataRecord>{  
    const map = new Map<string, DataRecord>();
    let randomValues = this.getRandomItems(values, count);
    for (let i = 0; i < randomValues.length; i++) {
      const value = randomValues[i];
      
      let addValueToMap = false;
      for (let retryCount = 0; retryCount < 3; retryCount++) {
        const field = this.getRandomField(value, fieldToSkip);
        addValueToMap = map.get(field) ? false : true;
        if(addValueToMap){
          map.set(field, value);
          break;
        }
      }

      if(!addValueToMap){
        i--;
      }
    }
  
    return map;
  }
  
  public getUniqueNumericFieldsAndValues(values: DataRecord[], count: number, fieldToSkip?: string): Map<string, DataRecord>{  
    const map = new Map<string, DataRecord>();
    let randomValues = this.getRandomItems(values, count);
    for (let i = 0; i < randomValues.length; i++) {
      const value = randomValues[i];
      
      let addValueToMap = false;
      for (let retryCount = 0; retryCount < 3; retryCount++) {
        const field = this.getRandomNumbericField(value, fieldToSkip);
        addValueToMap = map.get(field) ? false : true;
        if(addValueToMap){
          map.set(field, value);
          break;
        }
      }

      if(!addValueToMap){
        i--;
      }
    }
  
    return map;
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
  
  public getRandomFields(obj: DataRecord, fieldToSkip?: string, maxCount: number = 7): string[]{
    const fields = this.getFieldsAndSkip(obj, fieldToSkip);
    const fieldCountToUse = this.randomInt(2, maxCount);
    return this.getRandomItems(fields, fieldCountToUse);
  }

  public getRandomField(obj: DataRecord, fieldToSkip?: string): string{
    const fields = this.getFieldsAndSkip(obj, fieldToSkip);
    return this.getRandomItem(fields);
  }
  
  public getRandomNumbericField(obj: DataRecord, fieldToSkip?: string){
    const fields = this.getFieldsAndSkip(obj, fieldToSkip).filter(field => typeof obj[field] === 'number');
    return this.getRandomItem(fields);
  }
  
  private getFieldsAndSkip(obj: DataRecord, fieldToSkip?: string): string[]{
    const fields = this.getFields(obj);
    return fieldToSkip ? fields.filter((field) => field !== fieldToSkip) : fields;  
  }
  
  public getFields(obj: DataRecord): string[]{
    return Object.keys(obj).filter((field) => obj[field] !== null && obj[field] !== undefined);  
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