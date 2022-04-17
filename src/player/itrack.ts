export interface ITrack {
  id: string;
  title: string;
  description: string;
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
  author: {
    name: string;
    url: string;
    avatar: {
      url: string;
      width: number;
      height: number;
    };
  };
  views: number;
  duration: number;
  url: string;
  metadata: any;
}
