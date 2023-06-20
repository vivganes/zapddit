import { EventBuffer } from "./EventBuffer"

fdescribe('Event Buffer',() => {

    it('should return items for 2 and 4',()=>{
        const eventBuffer = new EventBuffer<number>()
        eventBuffer.events = [0,1,2,3,4,5,6,7];
        expect(eventBuffer.getItemsWithIndexes(2,4)).toEqual([2,3,4]);
    })

    it('should return items for 2 and 7',()=>{
        const eventBuffer = new EventBuffer<number>()
        eventBuffer.events = [0,1,2,3,4,5,6,7];
        expect(eventBuffer.getItemsWithIndexes(2,7)).toEqual([2,3,4,5,6,7]);
    })

    it('should return items for 2 and 8',()=>{
        const eventBuffer = new EventBuffer<number>()
        eventBuffer.events = [0,1,2,3,4,5,6,7];
        expect(eventBuffer.getItemsWithIndexes(2,8)).toEqual([2,3,4,5,6,7]);
    })

    it('should return items for 2 and 10',()=>{
        const eventBuffer = new EventBuffer<number>()
        eventBuffer.events = [0,1,2,3,4,5,6,7];
        expect(eventBuffer.getItemsWithIndexes(2,10)).toEqual([2,3,4,5,6,7]);
    })

    it('should return [] for 8 and 9',()=>{
        const eventBuffer = new EventBuffer<number>()
        eventBuffer.events = [0,1,2,3,4,5,6,7];
        expect(eventBuffer.getItemsWithIndexes(8,9)).toEqual(null);
    })

    it('should return null for 9 and 10',()=>{
        const eventBuffer = new EventBuffer<number>()
        eventBuffer.events = [0,1,2,3,4,5,6,7];
        expect(eventBuffer.getItemsWithIndexes(9,10)).toEqual(null);
    })

    it('should return null for 3 and 5',()=>{
        const eventBuffer = new EventBuffer<number>()
        eventBuffer.events = undefined;
        expect(eventBuffer.getItemsWithIndexes(3,5)).toEqual([]);
    })
})